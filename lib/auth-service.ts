import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const getUsername = (clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>) =>
  clerkUser.username?.trim() || "user-" + clerkUser.id.slice(-8).toLowerCase();

const ensureDatabaseUser = async (clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>) => {
  const username = getUsername(clerkUser);
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
  if (!self || getUsername(self) !== username) throw new Error("Unauthorized");
  return ensureDatabaseUser(self);
};
