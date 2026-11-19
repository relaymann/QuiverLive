"use client";

import React from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 px-4 text-muted-foreground">
      <p>Something went wrong.</p>
      <Button variant="secondary" onClick={() => window.location.assign("/")}>
        Go back home
      </Button>
      <Button variant="ghost" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
