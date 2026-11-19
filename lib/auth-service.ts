import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

const resolveUsername = async (clerkUser: ClerkUser) => {
  const requested = clerkUser.username?.trim() || "user-" + clerkUser.id.slice(-8).toLowerCase();
  const conflict = await db.user.findUnique({ where: { username: requested }, select: { externalUserId: true } });
  if (!conflict || conflict.externalUserId === clerkUser.id) return requested;
  return requested.slice(0, 50) + "-" + clerkUser.id.slice(-8).toLowerCase();
};

const ensureDatabaseUser = async (clerkUser: ClerkUser) => {
  const username = await resolveUsername(clerkUser);
  const imageUrl = clerkUser.imageUrl || "";
  const user = await db.user.upsert({
    where: { externalUserId: clerkUser.id },
    create: { externalUserId: clerkUser.id, username, imageUrl },
    update: { username, imageUrl },
  });
  await db.stream.upsert({
    where: { userId: user.id },
    create: { userId: user.id, name: username + "'s stream" },
    update: {},
  });
  return user;
};

export const getSelf = async () => {
  const self = await currentUser();
  if (!self) throw new Error("Unauthorized");
  return ensureDatabaseUser(self);
};

export const getSelfByUsername = async (username: string) => {
  const self = await currentUser();
  if (!self) throw new Error("Unauthorized");
  const user = await ensureDatabaseUser(self);
  if (user.username !== username) throw new Error("Unauthorized");
  return user;
};
