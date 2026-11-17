import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const getSearch = async (term?: string) => {
  const normalizedTerm = term?.trim().slice(0, 100);
  if (!normalizedTerm) return [];

  let userId: string | null = null;
  try {
    const self = await getSelf();
    userId = self.id;
  } catch {
    // Search remains available to public visitors.
  }

  return db.stream.findMany({
    where: {
      user: userId
        ? {
            NOT: {
              blocking: {
                some: { blockedId: userId },
              },
            },
          }
        : undefined,
      OR: [
        { name: { contains: normalizedTerm } },
        { user: { username: { contains: normalizedTerm } } },
      ],
    },
    select: {
      user: {
        select: {
          id: true,
          username: true,
          imageUrl: true,
        },
      },
      id: true,
      name: true,
      isLive: true,
      thumbnailUrl: true,
      updatedAt: true,
    },
    orderBy: [{ isLive: "desc" }, { updatedAt: "desc" }],
    take: 40,
  });
};
