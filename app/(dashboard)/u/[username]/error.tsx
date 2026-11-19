"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error("SchoolStream dashboard error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">Dashboard couldn’t load</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The dashboard failed to load. The error details below can help identify the actual cause instead of retrying blindly.
      </p>
      {error.message && <div className="max-w-2xl break-words rounded-md border p-3 text-left text-xs text-muted-foreground">{error.message}</div>}
      {error.digest && <p className="text-xs text-muted-foreground">Error reference: {error.digest}</p>}
      <Button type="button" onClick={() => reset()}>Try again</Button>
      <Button type="button" variant="ghost" onClick={() => window.location.assign("/")}>Return home</Button>
    </div>
  );
}
