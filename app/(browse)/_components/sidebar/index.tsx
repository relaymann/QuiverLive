import React from "react";

import { getRecommended } from "@/lib/recommended-service";
import { getFollwedUser } from "@/lib/follow-service";

import { Wrapper } from "./wrapper";
import { Toggle, ToggleSkeleton } from "./toggle";
import { Recommended, RecommendedSkeleton } from "./recommended";
import { Following, FollowingSkeleton } from "./following";

export async function Sidebar() {
  // Treat sidebar queries as independent optional data: a failure must not
  // take down the browse routes or the homepage.
  const [recommended, following] = await Promise.all([
    getRecommended().catch((error) => {
      console.error("Sidebar recommendations failed:", error);
      return [];
    }),
    getFollwedUser().catch((error) => {
      console.error("Sidebar following failed:", error);
      return [];
    }),
  ]);

  return (
    <Wrapper>
      <Toggle />
      <div className="space-y-4 pt-4 lg:pt-0">
        <Following data={following} />
        <Recommended data={recommended} />
      </div>
    </Wrapper>
  );
}

export function SidebarSkeleton() {
  return (
    <aside className="fixed left-0 z-50 flex h-full w-[70px] flex-col border-r border-[#2D2E35] bg-background lg:w-60">
      <ToggleSkeleton />
      <FollowingSkeleton />
      <RecommendedSkeleton />
    </aside>
  );
}
