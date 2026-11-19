"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function ChannelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => { console.error("Channel page error:", error); }, [error]);
  return (
    <div className="min-h-[60vh] flex flex-col gap-4 items-center justify-center p-6 text-center text-muted-foreground">
      <h2 className="font-semibold text-lg">This channel couldn’t load</h2>
      <p className="text-sm max-w-md">Something interrupted loading this channel. Try again.</p>
      <Button onClick={() => reset()}>Retry</Button>
      <Button variant="ghost" onClick={() => window.location.assign("/")}>Go back home</Button>
    </div>
  );
}
