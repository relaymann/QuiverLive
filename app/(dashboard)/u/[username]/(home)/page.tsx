import React from "react";
import { redirect } from "next/navigation";
import { getSelf } from "@/lib/auth-service";
import { getUserByUsername } from "@/lib/user-service";
import { BrowserBroadcast } from "@/components/stream-player/browser-broadcast";
import { StreamPlayer } from "@/components/stream-player";

export default async function CreatorPage({ params }: { params: Promise<{ username: string }>; }) {
  const { username } = await params;
  let self;
  let user;
  try {
    self = await getSelf();
    if (self.username !== username) redirect("/");
    user = await getUserByUsername(self.username);
  } catch (error) {
    // Do not swallow Next.js redirect exceptions.
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    console.error("Creator dashboard page data failed:", error);
    redirect("/");
  }
  if (!user || user.id !== self.id || !user.stream) redirect("/");
  return <div className="h-full space-y-4 p-4">
    <BrowserBroadcast hostIdentity={user.id} />
    <div className="min-h-0"><StreamPlayer user={user} stream={user.stream} isFollowing={true} /></div>
  </div>;
}
