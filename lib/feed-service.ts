import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const getStreams = async () => {
  let userId: string | null = null;

  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    // Public visitors can browse streams without an account.
  }

  return db.stream.findMany({
    where: userId
      ? {
          user: {
            AND: [
              { blocking: { none: { blockedId: userId } } },
              { blockedBy: { none: { blockerId: userId } } },
            ],
          },
        }
      : undefined,
    select: {
      thumbnailUrl: true,
      name: true,
      isLive: true,
      id: true,
      user: {
        select: {
          id: true,
          username: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
    take: 40,
  });
};
