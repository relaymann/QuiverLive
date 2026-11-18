"use server";

import { currentUser } from "@clerk/nextjs/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { getUserById } from "@/lib/user-service";
import { db } from "@/lib/db";
import { getOrCreateGuestIdentity } from "@/lib/guest-session";
import { extendBroadcastReservation, releaseBroadcastReservation, reserveBroadcast } from "@/lib/broadcast-reservation";
import { resetIngresses } from "@/lib/livekit-admin";

export const createViewerToken = async (hostIdentity: string) => {
  const clerkUser = await currentUser();
  const self = clerkUser
    ? await db.user.findUnique({ where: { externalUserId: clerkUser.id }, select: { id: true, username: true } })
    : await getOrCreateGuestIdentity();

  if (!self) throw new Error("Your account is still being provisioned. Please try again.");
  const host = await getUserById(hostIdentity);
  if (!host) throw new Error("User not found");

  if (self.id !== host.id && !self.id.startsWith("guest-")) {
    const blocked = await db.block.findFirst({
      where: { OR: [{ blockerId: host.id, blockedId: self.id }, { blockerId: self.id, blockedId: host.id }] },
      select: { id: true },
    });
    if (blocked) throw new Error("You cannot join this channel");
  }

  if (self.id !== host.id) {
    const hostStream = await db.stream.findUnique({ where: { userId: host.id }, select: { id: true } });
    if (!hostStream) throw new Error("This channel is unavailable");
    const moderation = await db.chatModeration.findUnique({
      where: { streamId_participantIdentity: { streamId: hostStream.id, participantIdentity: self.id } },
      select: { isBanned: true, timedOutUntil: true },
    });
    if (moderation?.isBanned) throw new Error("You are banned from this channel");
    if (moderation?.timedOutUntil && moderation.timedOutUntil <= new Date()) {
      await db.chatModeration.deleteMany({
        where: { streamId: hostStream.id, participantIdentity: self.id, isBanned: false, timedOutUntil: { lte: new Date() } },
      });
    }
  }

  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: self.id === host.id ? "host-" + self.id : self.id,
    name: self.username,
  });
  token.addGrant({ room: host.id, roomJoin: true, canPublish: false, canPublishData: false });
  return token.toJwt();
};

export const reserveBrowserBroadcast = async (hostIdentity: string) => {
  const clerk = await currentUser();
  const self = clerk
    ? await db.user.findUnique({ where: { externalUserId: clerk.id }, select: { id: true } })
    : null;
  if (!self || self.id !== hostIdentity) throw new Error("Only the channel owner can broadcast");

  const existing = await db.stream.findUnique({
    where: { userId: self.id },
    select: { isLive: true, broadcastSource: true, broadcastSessionId: true },
  });
  if (!existing) throw new Error("No stream is configured for this account");
  if (existing.isLive) throw new Error("Your channel is already live. Stop the current broadcast first.");
  if (existing.broadcastSource === "ingress" && existing.broadcastSessionId) {
    await releaseBroadcastReservation(self.id, existing.broadcastSessionId, "ingress");
  }

  const sessionId = await reserveBroadcast(self.id, "browser");
  try {
    await resetIngresses(self.id);
    await db.stream.update({
      where: { userId: self.id },
      data: { ingressId: null, serverUrl: null, streamKey: null },
    });
    return sessionId;
  } catch (error) {
    await releaseBroadcastReservation(self.id, sessionId, "browser");
    throw error;
  }
};

export const createBroadcasterToken = async (hostIdentity: string, sessionId: string) => {
  const clerk = await currentUser();
  const self = clerk
    ? await db.user.findUnique({ where: { externalUserId: clerk.id }, select: { id: true, username: true } })
    : null;
  if (!self || self.id !== hostIdentity) throw new Error("Only the channel owner can start a browser broadcast");

  await extendBroadcastReservation(self.id, sessionId);
  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: `browser-${self.id}-${sessionId}`,
    name: self.username,
    ttl: 300,
  });
  token.addGrant({ room: self.id, roomJoin: true, canPublish: true, canPublishData: false });
  return token.toJwt();
};

export const releaseBrowserBroadcast = async (hostIdentity: string, sessionId: string) => {
  const clerk = await currentUser();
  const self = clerk
    ? await db.user.findUnique({ where: { externalUserId: clerk.id }, select: { id: true } })
    : null;
  if (!self || self.id !== hostIdentity) return { released: false };

  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (apiUrl && apiKey && apiSecret) {
    const roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret);
    try { await roomService.removeParticipant(self.id, `browser-${self.id}-${sessionId}`); } catch { /* Already disconnected. */ }
  }

  await db.stream.updateMany({
    where: { userId: self.id, broadcastSource: "browser", broadcastSessionId: sessionId },
    data: { isLive: false, broadcastSource: null, broadcastSessionId: null, broadcastLeaseExpiresAt: null },
  });
  await releaseBroadcastReservation(self.id, sessionId, "browser");
  return { released: true };
};
