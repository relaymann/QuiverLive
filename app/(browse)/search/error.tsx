"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function SearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => { console.error("Search route error:", error); }, [error]);
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">Search couldn’t load</h2>
      <p className="max-w-md text-sm text-muted-foreground">Try again. If this continues, the search service may be temporarily unavailable.</p>
      <Button onClick={() => reset()}>Retry search</Button>
      <Button variant="ghost" onClick={() => window.location.assign("/")}>Go home</Button>
    </div>
  );
}
