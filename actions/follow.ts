"use server";

import { revalidatePath } from "next/cache";

import { followUser, unfollowUser } from "@/lib/follow-service";

export const onFollow = async (id: string) => {
  try {
    const followedUser = await followUser(id);
    revalidatePath("/");
    revalidatePath(`/${followedUser.following.username}`);
    return followedUser;
  } catch {
    throw new Error("Unable to follow this channel");
  }
};

export const onUnfollow = async (id: string) => {
  try {
    const unfollowedUser = await unfollowUser(id);
    revalidatePath("/");
    revalidatePath(`/${unfollowedUser.following.username}`);
    return unfollowedUser;
  } catch {
    throw new Error("Unable to unfollow this channel");
  }
};
