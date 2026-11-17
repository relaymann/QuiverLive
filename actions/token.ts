"use server";

import { v4 } from "uuid";
import { currentUser } from "@clerk/nextjs";
import { AccessToken } from "livekit-server-sdk";

import { getUserById } from "@/lib/user-service";
import { db } from "@/lib/db";

export const createViewerToken = async (hostIdentity: string) => {
  // Only a genuinely unauthenticated request becomes a guest. Database or
  // Clerk failures must not silently downgrade an account to guest access.
  const clerkUser = await currentUser();
  const guestId = v4();

  const self = clerkUser
    ? await db.user.findUnique({
        where: { externalUserId: clerkUser.id },
        select: { id: true, username: true },
      })
    : {
        id: guestId,
        username: `guest-${guestId.slice(0, 8)}`,
      };

  if (!self) {
    throw new Error("Your account is still being provisioned. Please try again.");
  }

  const host = await getUserById(hostIdentity);
  if (!host) {
    throw new Error("User not found");
  }

  const isHost = self.id === host.id;

  if (!isHost && clerkUser) {
    const hostBlock = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: host.id,
          blockedId: self.id,
        },
      },
      select: { id: true },
    });

    if (hostBlock) {
      throw new Error("You are blocked by this channel");
    }
  }

  let canPublishData = host.stream?.isChatEnabled === true;

  if (canPublishData && !isHost && host.stream?.isChatFollowersOnly) {
    const existingFollow = clerkUser
      ? await db.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: self.id,
              followingId: host.id,
            },
          },
          select: { id: true },
        })
      : null;

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
    // Disabled and followers-only chat are enforced when the token is issued.
    // Slow mode still needs a server-mediated chat relay/rate limiter.
    canPublishData,
  });

  return token.toJwt();
};
