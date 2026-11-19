import React from "react";
import { redirect } from "next/navigation";
import { getSelfByUsername } from "@/lib/auth-service";
import { getUserByUsername } from "@/lib/user-service";
import { BrowserBroadcast } from "@/components/stream-player/browser-broadcast";
import { StreamPlayer } from "@/components/stream-player";

export default async function CreatorPage({ params }: { params: Promise<{ username: string }>; }) {
  const { username } = await params;
  let self;
  let user;
  try {
    self = await getSelfByUsername(username);
    user = await getUserByUsername(username);
  } catch {
    redirect("/");
  }
  if (!user || user.id !== self.id || !user.stream) redirect("/");
  return <div className="h-full space-y-4 p-4">
    <BrowserBroadcast hostIdentity={user.id} />
    <div className="min-h-0"><StreamPlayer user={user} stream={user.stream} isFollowing={true} /></div>
  </div>;
}
