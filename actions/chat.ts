"use server";

import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { db } from "@/lib/db";
import { getGuestIdentity } from "@/lib/guest-session";

const formatElapsed = (totalSeconds: number) => {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.length ? parts.join(" ") : "<1m";
};

export const sendChatMessage = async (hostIdentity: string, rawMessage: string) => {
  if (typeof rawMessage !== "string") throw new Error("Invalid chat message");
  const message = rawMessage.trim();
  if (!message || message.length > 300) throw new Error("Messages must be between 1 and 300 characters");

  const clerkUser = await currentUser();
  const self = clerkUser
    ? await db.user.findUnique({ where: { externalUserId: clerkUser.id }, select: { id: true, username: true } })
    : await getGuestIdentity();
  if (!self) throw new Error("Your account is still being provisioned. Please try again.");

  const host = await db.user.findUnique({
    where: { id: hostIdentity },
    select: { id: true, username: true, stream: { select: { id: true, isChatEnabled: true, isChatDelayed: true, isChatFollowersOnly: true } } },
  });
  if (!host?.stream) throw new Error("This channel is unavailable");
  if (!host.stream.isChatEnabled) throw new Error("Chat is disabled");

  if (!self.id.startsWith("guest-")) {
    const blocked = await db.block.findFirst({
      where: { OR: [{ blockerId: host.id, blockedId: self.id }, { blockerId: self.id, blockedId: host.id }] },
      select: { id: true },
    });
    if (blocked) throw new Error("You cannot chat in this channel");
  }

  if (host.stream.isChatFollowersOnly && self.id !== host.id) {
    if (self.id.startsWith("guest-")) throw new Error("Sign in and follow this channel to chat");
    const follow = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: self.id, followingId: host.id } },
      select: { id: true },
    });
    if (!follow) throw new Error("Follow this channel to chat");
  }

  const moderation = await db.chatModeration.findUnique({
    where: { streamId_participantIdentity: { streamId: host.stream.id, participantIdentity: self.id } },
    select: { isBanned: true, timedOutUntil: true },
  });
  if (moderation?.isBanned) throw new Error("You are banned from this channel");
  if (moderation?.timedOutUntil && moderation.timedOutUntil > new Date()) {
    const seconds = Math.ceil((moderation.timedOutUntil.getTime() - Date.now()) / 1000);
    throw new Error(`You are timed out. Try again in ${seconds} seconds.`);
  }
  if (moderation?.timedOutUntil) {
    await db.chatModeration.deleteMany({
      where: { streamId: host.stream.id, participantIdentity: self.id, isBanned: false, timedOutUntil: { lte: new Date() } },
    });
  }

  const now = new Date();
  const delayMs = host.stream.isChatDelayed ? 3000 : 1000;
  if (self.id.startsWith("guest-")) {
    await db.guestChatRateLimit.upsert({
      where: { streamId_senderIdentity: { streamId: host.stream.id, senderIdentity: self.id } },
      create: { streamId: host.stream.id, senderIdentity: self.id, nextAllowedAt: new Date(0) },
      update: {},
    });
    const claimed = await db.guestChatRateLimit.updateMany({
      where: { streamId: host.stream.id, senderIdentity: self.id, nextAllowedAt: { lte: now } },
      data: { nextAllowedAt: new Date(now.getTime() + delayMs) },
    });
    if (claimed.count !== 1) throw new Error(host.stream.isChatDelayed
      ? "Slow mode is on. Wait 3 seconds between messages."
      : "Please wait a moment before sending another message.");
  } else {
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
  }

  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiUrl || !apiKey || !apiSecret) throw new Error("Chat service is not configured");

  let outgoingMessage = message;
  let senderId = self.id;
  let senderName = self.username;
  const command = message.toLowerCase();

  if (command === "!watchtime") {
    const rows = await db.$queryRaw<Array<{ totalSeconds: bigint | number }>>(Prisma.sql`
      SELECT FLOOR(
        COALESCE(
          SUM(EXTRACT(EPOCH FROM (COALESCE("endedAt", CURRENT_TIMESTAMP) - "startedAt"))),
          0
        )
      )::bigint AS "totalSeconds"
      FROM "WatchSession"
      WHERE "streamId" = ${host.stream.id}
        AND "participantIdentity" = ${self.id}
    `);
    const totalSeconds = Math.max(0, Number(rows[0]?.totalSeconds ?? 0));
    outgoingMessage = `@${self.username} has watched @${host.username}'s channel for ${formatElapsed(totalSeconds)}.`;
    senderId = "system";
    senderName = "QuiverLive";
  } else if (command === "!followage") {
    const follow = self.id.startsWith("guest-") ? null : await db.follow.findUnique({
      where: { followerId_followingId: { followerId: self.id, followingId: host.id } },
      select: { createdAt: true },
    });
    outgoingMessage = follow
      ? `@${self.username} has been following @${host.username} for ${formatElapsed(Math.max(0, Math.floor((Date.now() - follow.createdAt.getTime()) / 1000)))}.`
      : `@${self.username} isn't following @${host.username} yet.`;
    senderId = "system";
    senderName = "QuiverLive";
  } else {
    const match = /^!([a-z0-9_]{1,32})(?:\s|$)/i.exec(message);
    if (match) {
      const customCommand = await db.chatCommand.findUnique({
        where: { streamId_name: { streamId: host.stream.id, name: match[1].toLowerCase() } },
        select: { id: true, response: true, enabled: true, cooldownSeconds: true },
      });
      if (customCommand?.enabled) {
        let canRun = true;
        if (customCommand.cooldownSeconds > 0) {
          const claimed = await db.chatCommand.updateMany({
            where: {
              id: customCommand.id,
              enabled: true,
              OR: [
                { lastUsedAt: null },
                { lastUsedAt: { lte: new Date(Date.now() - customCommand.cooldownSeconds * 1000) } },
              ],
            },
            data: { lastUsedAt: new Date() },
          });
          canRun = claimed.count === 1;
        }
        outgoingMessage = canRun ? customCommand.response : "That command is on cooldown.";
        senderId = "system";
        senderName = "QuiverLive";
      }
    }
  }

  const payload = new TextEncoder().encode(JSON.stringify({
    id: randomUUID(), message: outgoingMessage, timestamp: Date.now(), senderId, senderName,
  }));
  const roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret);
  await roomService.sendData(host.id, payload, 0);
  return { sent: true };
};
