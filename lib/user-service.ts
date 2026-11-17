import { db } from "@/lib/db";

export const getUserByUsername = async (username: string) => {
  return db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      bio: true,
      imageUrl: true,
      stream: {
        select: {
          id: true,
          isLive: true,
          isChatDelayed: true,
          isChatEnabled: true,
          isChatFollowersOnly: true,
          thumbnailUrl: true,
          name: true,
        },
      },
      _count: {
        select: { followedBy: true },
      },
    },
  });
};

export const getUserById = async (id: string) => {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      stream: {
        select: {
          isChatEnabled: true,
          isChatFollowersOnly: true,
        },
      },
    },
  });
};
