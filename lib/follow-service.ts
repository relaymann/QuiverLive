import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const getFollwedUser = async () => {
  try {
    const self = await getSelf();
    const blocks = await db.block.findMany({
      where: { blockerId: self.id },
      select: { blockedId: true },
    });
    const blockedIds = blocks.map((block) => block.blockedId);

    return await db.follow.findMany({
      where: {
        followerId: self.id,
        followingId: { notIn: blockedIds },
        following: { blocking: { none: { blockedId: self.id } } },
      },
      select: {
        id: true,
        following: {
          select: {
            id: true,
            username: true,
            imageUrl: true,
            stream: { select: { isLive: true } },
          },
        },
      },
    });
  } catch {
    return [];
  }
};

export const isFollowingUser = async (id: string) => {
  try {
    const self = await getSelf();
    const otherUser = await db.user.findUnique({ where: { id }, select: { id: true } });
    if (!otherUser) return false;
    if (otherUser.id === self.id) return true;

    const blocked = await db.block.findFirst({
      where: { OR: [{ blockerId: self.id, blockedId: otherUser.id }, { blockerId: otherUser.id, blockedId: self.id }] },
      select: { id: true },
    });
    if (blocked) return false;

    const existingFollow = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: self.id, followingId: otherUser.id } },
      select: { id: true },
    });
    return !!existingFollow;
  } catch {
    return false;
  }
};

export const followUser = async (id: string) => {
  const self = await getSelf();
  const otherUser = await db.user.findUnique({ where: { id }, select: { id: true, username: true } });
  if (!otherUser) throw new Error("User not found");
  if (otherUser.id === self.id) throw new Error("You can't follow yourself");

  const blocked = await db.block.findFirst({
    where: { OR: [{ blockerId: self.id, blockedId: otherUser.id }, { blockerId: otherUser.id, blockedId: self.id }] },
    select: { id: true },
  });
  if (blocked) throw new Error("You cannot follow this user while either account has blocked the other");

  const existingFollow = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: self.id, followingId: otherUser.id } },
    select: { id: true },
  });
  if (existingFollow) throw new Error("You are already following this user");

  return db.follow.create({
    data: { followerId: self.id, followingId: otherUser.id },
    select: { following: { select: { username: true } } },
  });
};

export const unfollowUser = async (id: string) => {
  const self = await getSelf();
  const existingFollow = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: self.id, followingId: id } },
    select: { id: true, following: { select: { username: true } } },
  });
  if (!existingFollow) throw new Error("You are not following this user");

  return db.follow.delete({
    where: { id: existingFollow.id },
    select: { following: { select: { username: true } } },
  });
};
