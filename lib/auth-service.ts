import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const ensureDatabaseUser = async (clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>) => {
  if (!clerkUser.username) throw new Error("Your Clerk account needs a username before you can use SchoolStream.");
  const username = clerkUser.username;
  const imageUrl = clerkUser.imageUrl || "";

  // Webhook delivery can be delayed or misconfigured. Provision the signed-in
  // user on demand so dashboard navigation doesn't depend on a webhook having
  // already created the database record.
  return db.user.upsert({
    where: { externalUserId: clerkUser.id },
    create: {
      externalUserId: clerkUser.id,
      username,
      imageUrl,
      stream: { create: { name: username + "'s stream" } },
    },
    update: { username, imageUrl },
  });
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
