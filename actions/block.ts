"use server";

import { revalidatePath } from "next/cache";
import { RoomServiceClient } from "livekit-server-sdk";

import { blockUser, unblockUser } from "@/lib/block-service";
import { getSelf } from "@/lib/auth-service";
import { db } from "@/lib/db";

export const onBlock = async (id: string) => {
  const self = await getSelf();
  if (!id || id === self.id) {
    throw new Error("Invalid user to block");
  }

  const target = await db.user.findUnique({
    where: { id },
    select: { username: true },
  });

  // Persist blocks for registered users. Guests have ephemeral identities,
  // so they can only be removed from the current room.
  if (target) {
    await blockUser(id);
  }

  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (apiUrl && apiKey && apiSecret) {
    try {
      const roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret);
      await roomService.removeParticipant(self.id, id);
    } catch {
      // The block remains persisted even if the participant already left.
    }
  }

  revalidatePath(`/u/${self.username}/community`);
  return { blocked: { username: target?.username ?? "guest" } };
};

export const onUnblock = async (id: string) => {
  const self = await getSelf();
  const unblockedUser = await unblockUser(id);

  revalidatePath(`/u/${self.username}/community`);
  return { blocked: { username: unblockedUser.blocked.username } };
};
