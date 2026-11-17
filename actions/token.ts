"use server";

import { v4 } from "uuid";
import { AccessToken } from "livekit-server-sdk";

import { getSelf } from "@/lib/auth-service";
import { getUserById } from "@/lib/user-service";
import { isBlockedByUser } from "@/lib/block-service";
import { db } from "@/lib/db";

export const createViewerToken = async (hostIdentity: string) => {
  let self: { id: string; username: string };
  let isGuest = false;

  try {
    const authenticatedUser = await getSelf();
    self = { id: authenticatedUser.id, username: authenticatedUser.username };
  } catch {
    // Guests receive an ephemeral identity and never gain creator privileges.
    isGuest = true;
    self = {
      id: v4(),
      username: `guest-${v4().slice(0, 8)}`,
    };
  }

  const host = await getUserById(hostIdentity);
  if (!host) {
    throw new Error("User not found");
  }

  if (await isBlockedByUser(host.id)) {
    throw new Error("User is blocked");
  }

  const isHost = !isGuest && self.id === host.id;

  let canPublishData = isHost || host.stream?.isChatEnabled === true;

  if (
    canPublishData &&
    !isHost &&
    host.stream?.isChatFollowersOnly
  ) {
    const existingFollow = isGuest
      ? null
      : await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: self.id,
              followingId: host.id,
            },
          },
          select: { id: true },
        });

    canPublishData = !!existingFollow;
  }

  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: isHost ? `host-${self.id}` : self.id,
      name: self.username,
    }
  );

  token.addGrant({
    room: host.id,
    roomJoin: true,
    canPublish: false,
    // Enforce disabled and followers-only chat at token issuance. Slow mode
    // still requires a server-mediated chat relay/rate limiter; LiveKit data
    // grants alone cannot enforce per-message timing.
    canPublishData,
  });

  return token.toJwt();
};
