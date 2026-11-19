"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold">Dashboard couldn’t load</h2>
      <p className="max-w-md text-sm text-muted-foreground">Something interrupted loading your dashboard. You can retry without leaving this page.</p>
      <Button type="button" onClick={() => reset()}>Try again</Button>
      <Button type="button" variant="ghost" onClick={() => window.location.assign("/")}>Return home</Button>
    </div>
  );
}
