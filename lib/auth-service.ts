import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const ensureDatabaseUser = async (clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>) => {
  if (!clerkUser.username) throw new Error("Your Clerk account needs a username before you can use SchoolStream.");
  const username = clerkUser.username;
  const imageUrl = clerkUser.imageUrl || "";

  // Provision the user independently from the stream. This also repairs accounts
  // whose user record exists but whose stream was never created by the webhook.
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
  if (!self || !self.username) throw new Error("Unauthorized");
  return ensureDatabaseUser(self);
};

export const getSelfByUsername = async (username: string) => {
  const self = await currentUser();
  if (!self || !self.username) throw new Error("Unauthorized");
  if (self.username !== username) throw new Error("Unauthorized");
  return ensureDatabaseUser(self);
};
