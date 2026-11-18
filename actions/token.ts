"use server";

import { v4 } from "uuid";
import { currentUser } from "@clerk/nextjs/server";
import { AccessToken } from "livekit-server-sdk";
import { getUserById } from "@/lib/user-service";
import { db } from "@/lib/db";

export const createViewerToken = async (hostIdentity: string) => {
  const clerkUser = await currentUser();
  const guestId = v4();
  const self = clerkUser
    ? await db.user.findUnique({ where: { externalUserId: clerkUser.id }, select: { id: true, username: true } })
    : { id: guestId, username: "guest-" + guestId.slice(0, 8) };

  if (!self) throw new Error("Your account is still being provisioned. Please try again.");
  const host = await getUserById(hostIdentity);
  if (!host) throw new Error("User not found");

  if (self.id !== host.id && clerkUser) {
    const blocked = await db.block.findFirst({
      where: { OR: [{ blockerId: host.id, blockedId: self.id }, { blockerId: self.id, blockedId: host.id }] },
      select: { id: true },
    });
    if (blocked) throw new Error("You cannot join this channel");
  }

  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: self.id === host.id ? "host-" + self.id : self.id,
    name: self.username,
  });
  token.addGrant({ room: host.id, roomJoin: true, canPublish: false, canPublishData: false });
  return token.toJwt();
};

/** Mint a short-lived publishing token only when the owner actually starts broadcasting. */
export const createBroadcasterToken = async (hostIdentity: string) => {
  const clerk = await currentUser();
  const self = clerk
    ? await db.user.findUnique({ where: { externalUserId: clerk.id }, select: { id: true, username: true } })
    : null;
  if (!self || self.id !== hostIdentity) throw new Error("Only the channel owner can start a browser broadcast");

  const stream = await db.stream.findUnique({
    where: { userId: self.id },
    select: { id: true, isLive: true },
  });
  if (!stream) throw new Error("No stream is configured for this account");
  if (stream.isLive) throw new Error("Your channel is already live. Stop the other stream source first.");

  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: self.id,
    name: self.username,
    ttl: 300,
  });
  token.addGrant({ room: self.id, roomJoin: true, canPublish: true, canPublishData: false });
  return token.toJwt();
};

export const assertCanStartBrowserBroadcast = async (hostIdentity: string) => {
  const clerk = await currentUser();
  const self = clerk
    ? await db.user.findUnique({ where: { externalUserId: clerk.id }, select: { id: true } })
    : null;
  if (!self || self.id !== hostIdentity) throw new Error("Only the channel owner can broadcast");

  const stream = await db.stream.findUnique({ where: { userId: self.id }, select: { isLive: true } });
  if (!stream) throw new Error("No stream is configured for this account");
  if (stream.isLive) throw new Error("Your channel is already live. Stop the other stream source first.");
  return true;
};
