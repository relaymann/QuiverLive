import React from "react";

import { getSelf } from "@/lib/auth-service";
import { getUserByUsername } from "@/lib/user-service";
import { StreamPlayer } from "@/components/stream-player";

export default async function CreatorPage({
  params: { username },
}: {
  params: { username: string };
}) {
  const self = await getSelf();
  const user = await getUserByUsername(username);

  if (!user || user.id !== self.id || !user.stream) {
    throw new Error("Unauthorized");
  }

  return (
    <div className="h-full">
      <StreamPlayer user={user} stream={user.stream} isFollowing={true} />
    </div>
  );
}
