"use server";

import { User } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSelf } from "@/lib/auth-service";
import { db } from "@/lib/db";

export const updateUser = async (values: Partial<User>) => {
  const self = await getSelf();

  if (values.bio !== undefined && values.bio !== null && typeof values.bio !== "string") {
    throw new Error("Invalid bio");
  }

  const bio = values.bio?.trim() || null;
  if (bio && bio.length > 500) {
    throw new Error("Bio must be 500 characters or fewer");
  }

  const user = await db.user.update({
    where: { id: self.id },
    data: { bio },
    select: {
      id: true,
      username: true,
      bio: true,
      imageUrl: true,
    },
  });

  revalidatePath(`/${self.username}`);
  revalidatePath(`/u/${self.username}`);

  return user;
};
