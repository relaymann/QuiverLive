import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const getRecommended = async () => {
  let userId: string | null = null;

  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    // Recommendations are also available to signed-out visitors.
  }

  return db.user.findMany({
    where: userId
      ? {
          AND: [
            { NOT: { id: userId } },
            { NOT: { followedBy: { some: { followerId: userId } } } },
            { blocking: { none: { blockedId: userId } } },
            { blockedBy: { none: { blockerId: userId } } },
          ],
        }
      : undefined,
    select: {
      id: true,
      username: true,
      imageUrl: true,
      stream: {
        select: { isLive: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
};
