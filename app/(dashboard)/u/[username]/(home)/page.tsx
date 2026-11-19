import React from "react";
import { getSelf } from "@/lib/auth-service";
import { getUserByUsername } from "@/lib/user-service";
import { BrowserBroadcast } from "@/components/stream-player/browser-broadcast";
import { StreamPlayer } from "@/components/stream-player";

export default async function CreatorPage({ params }: { params: Promise<{ username: string }>; }) {
  const { username } = await params;
  const self = await getSelf();
  if (username !== self.username) throw new Error("Dashboard route did not resolve to the signed-in creator.");
  const user = await getUserByUsername(self.username);
  if (!user?.stream) throw new Error("Your stream record is missing. Account provisioning needs to be repaired.");
  return <div className="h-full space-y-4 p-4">
    <BrowserBroadcast hostIdentity={user.id} />
    <div className="min-h-0"><StreamPlayer user={user} stream={user.stream} isFollowing={true} /></div>
  </div>;
}
