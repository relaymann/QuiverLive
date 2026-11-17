"use server";

import { randomUUID } from "crypto";
import { RoomServiceClient } from "livekit-server-sdk";
import { getSelf } from "@/lib/auth-service";
import { db } from "@/lib/db";

/** Server-relayed chat prevents clients from bypassing moderation and slow mode. */
export const sendChatMessage = async (hostIdentity: string, rawMessage: string) => {
  const self = await getSelf();
  const message = rawMessage.trim();
  if (!message || message.length > 300) throw new Error("Messages must be between 1 and 300 characters");

  const host = await db.user.findUnique({
    where: { id: hostIdentity },
    select: { id: true, stream: { select: { id: true, isChatEnabled: true, isChatDelayed: true, isChatFollowersOnly: true } } },
  });
  if (!host?.stream) throw new Error("This channel is unavailable");
  if (!host.stream.isChatEnabled) throw new Error("Chat is disabled");

  const blocked = await db.block.findFirst({
    where: { OR: [{ blockerId: host.id, blockedId: self.id }, { blockerId: self.id, blockedId: host.id }] },
    select: { id: true },
  });
  if (blocked) throw new Error("You cannot chat in this channel");

  if (host.stream.isChatFollowersOnly) {
    const follow = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: self.id, followingId: host.id } },
      select: { id: true },
    });
    if (!follow) throw new Error("Follow this channel to chat");
  }

  const now = new Date();
  const delayMs = host.stream.isChatDelayed ? 3000 : 1000;
  await db.chatRateLimit.upsert({
    where: { streamId_senderId: { streamId: host.stream.id, senderId: self.id } },
    create: { streamId: host.stream.id, senderId: self.id, nextAllowedAt: new Date(0) },
    update: {},
  });
  const claimed = await db.chatRateLimit.updateMany({
    where: { streamId: host.stream.id, senderId: self.id, nextAllowedAt: { lte: now } },
    data: { nextAllowedAt: new Date(now.getTime() + delayMs) },
  });
  if (claimed.count !== 1) throw new Error(host.stream.isChatDelayed
    ? "Slow mode is on. Wait 3 seconds between messages."
    : "Please wait a moment before sending another message.");

  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiUrl || !apiKey || !apiSecret) throw new Error("Chat service is not configured");

  const payload = new TextEncoder().encode(JSON.stringify({
    id: randomUUID(), message, timestamp: now.getTime(), senderId: self.id, senderName: self.username,
  }));
  const roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret);
  await roomService.sendData(host.id, payload, 0);
  return { sent: true };
};
