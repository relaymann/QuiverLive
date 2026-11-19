"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function BrowseError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => { console.error("Browse route error:", error); }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">This page couldn’t load</h2>
      <p className="max-w-md text-sm text-muted-foreground">A temporary error interrupted this page. Try loading it again.</p>
      <Button onClick={() => reset()}>Retry</Button>
      <Button variant="ghost" onClick={() => window.location.assign("/")}>Go home</Button>
    </div>
  );
}
