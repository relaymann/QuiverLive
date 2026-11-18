"use server";

import { revalidatePath } from "next/cache";
import { RoomServiceClient } from "livekit-server-sdk";
import { getSelf } from "@/lib/auth-service";
import { db } from "@/lib/db";

const getOwnedStream = async (hostIdentity: string) => {
  const self = await getSelf();
  if (self.id !== hostIdentity) throw new Error("Only the channel owner can moderate chat");
  const stream = await db.stream.findUnique({ where: { userId: self.id }, select: { id: true } });
  if (!stream) throw new Error("No stream is configured for this channel");
  return { self, stream };
};

const getRoomService = () => {
  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiUrl || !apiKey || !apiSecret) throw new Error("LiveKit is not configured");
  return new RoomServiceClient(apiUrl, apiKey, apiSecret);
};

export const moderateChatParticipant = async (
  hostIdentity: string,
  participantIdentity: string,
  action: "timeout" | "ban",
) => {
  const { self, stream } = await getOwnedStream(hostIdentity);
  if (typeof participantIdentity !== "string" || !participantIdentity || participantIdentity.length > 128) {
    throw new Error("Invalid participant");
  }
  if (participantIdentity === self.id || participantIdentity === `host-${self.id}`) {
    throw new Error("You cannot moderate yourself");
  }

  const participantUser = await db.user.findUnique({
    where: { id: participantIdentity },
    select: { id: true },
  });
  if (action === "ban" && !participantUser) {
    throw new Error("Guest viewers can be timed out, but persistent bans require an account");
  }

  const roomService = getRoomService();
  try {
    await roomService.getParticipant(self.id, participantIdentity);
  } catch {
    throw new Error("That viewer is no longer in the channel");
  }

  const existing = await db.chatModeration.findUnique({
    where: { streamId_participantIdentity: { streamId: stream.id, participantIdentity } },
    select: { isBanned: true },
  });
  if (existing?.isBanned) throw new Error("This viewer is already banned");

  const timedOutUntil = action === "timeout" ? new Date(Date.now() + 5 * 60 * 1000) : null;
  await db.chatModeration.upsert({
    where: { streamId_participantIdentity: { streamId: stream.id, participantIdentity } },
    create: {
      streamId: stream.id,
      participantIdentity,
      participantUserId: participantUser?.id ?? null,
      isBanned: action === "ban",
      timedOutUntil,
    },
    update: {
      participantUserId: participantUser?.id ?? null,
      isBanned: action === "ban",
      timedOutUntil,
    },
  });

  // Removing the participant also revokes their current LiveKit token on LiveKit Cloud.
  await roomService.removeParticipant(self.id, participantIdentity);
  revalidatePath(`/u/${self.username}/chat`);
  return { success: true };
};

export const unbanChatParticipant = async (hostIdentity: string, participantIdentity: string) => {
  const { self, stream } = await getOwnedStream(hostIdentity);
  if (typeof participantIdentity !== "string" || !participantIdentity || participantIdentity.length > 128) {
    throw new Error("Invalid participant");
  }
  await db.chatModeration.deleteMany({
    where: { streamId: stream.id, participantIdentity, isBanned: true },
  });
  revalidatePath(`/u/${self.username}/chat`);
  return { success: true };
};
