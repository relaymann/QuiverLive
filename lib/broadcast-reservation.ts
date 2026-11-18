import "server-only";

import { randomUUID } from "crypto";
import { db } from "@/lib/db";

export type BroadcastSource = "browser" | "ingress";

const LEASE_MS = 10 * 60 * 1000;

export const reserveBroadcast = async (userId: string, source: BroadcastSource) => {
  const sessionId = randomUUID();
  const now = new Date();
  const claimed = await db.stream.updateMany({
    where: {
      userId,
      isLive: false,
      OR: [
        { broadcastSessionId: null },
        { broadcastLeaseExpiresAt: { lte: now } },
      ],
    },
    data: {
      broadcastSource: source,
      broadcastSessionId: sessionId,
      broadcastLeaseExpiresAt: new Date(now.getTime() + LEASE_MS),
    },
  });
  if (claimed.count !== 1) {
    throw new Error("This channel is already live or another broadcast source is starting. Stop it or wait for the connection to finish.");
  }
  return sessionId;
};

export const extendBroadcastReservation = async (userId: string, sessionId: string) => {
  const now = new Date();
  const updated = await db.stream.updateMany({
    where: {
      userId,
      isLive: false,
      broadcastSource: "browser",
      broadcastSessionId: sessionId,
      broadcastLeaseExpiresAt: { gt: now },
    },
    data: { broadcastLeaseExpiresAt: new Date(now.getTime() + LEASE_MS) },
  });
  if (updated.count !== 1) throw new Error("Your broadcast reservation expired. Please start again.");
};

export const releaseBroadcastReservation = async (userId: string, sessionId: string, source: BroadcastSource) => {
  await db.stream.updateMany({
    where: { userId, isLive: false, broadcastSource: source, broadcastSessionId: sessionId },
    data: {
      broadcastSource: null,
      broadcastSessionId: null,
      broadcastLeaseExpiresAt: null,
    },
  });
};
