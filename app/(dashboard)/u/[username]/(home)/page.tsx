import React from "react";

import { getSelf } from "@/lib/auth-service";
import { getUserByUsername } from "@/lib/user-service";
import { createBroadcasterToken } from "@/actions/token";
import { BrowserBroadcast } from "@/components/stream-player/browser-broadcast";
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

  const broadcasterToken = await createBroadcasterToken(user.id);

  return (
    <div className="h-full space-y-4 p-4">
      <BrowserBroadcast token={broadcasterToken} hostIdentity={user.id} />
      <div className="min-h-0">
        <StreamPlayer user={user} stream={user.stream} isFollowing={true} />
      </div>
    </div>
  );
}
