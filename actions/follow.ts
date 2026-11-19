"use server";

import { revalidatePath } from "next/cache";
import { followUser, unfollowUser } from "@/lib/follow-service";

export const onFollow = async (id: string) => {
  const followedUser = await followUser(id);
  revalidatePath("/");
  revalidatePath(`/${followedUser.following.username}`);
  return followedUser;
};

export const onUnfollow = async (id: string) => {
  const unfollowedUser = await unfollowUser(id);
  revalidatePath("/");
  revalidatePath(`/${unfollowedUser.following.username}`);
  return unfollowedUser;
};
