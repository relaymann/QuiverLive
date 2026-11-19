import React from "react";

import { getStreams } from "@/lib/feed-service";
import { Skeleton } from "@/components/ui/skeleton";

import { ResultCard, ResultCardSkeleton } from "../result-card";

export async function Results() {
  // Keep a feed/database outage from crashing the entire browse homepage.
  let data;
  try {
    data = await getStreams();
  } catch (error) {
    console.error("Failed to load the homepage stream feed:", error);
    return (
      <section aria-labelledby="discover-streams-heading" role="status">
        <h2 id="discover-streams-heading" className="text-lg font-semibold tracking-tight">
          Explore channels
        </h2>
        <div className="mt-4 rounded-xl border border-dashed border-white/15 px-6 py-12 text-center">
          <p className="font-medium">Streams are temporarily unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The homepage is still available. Please refresh in a moment to load channels.
          </p>
        </div>
      </section>
    );
  }

  const liveCount = data.filter((stream) => stream.isLive).length;

  return (
    <section aria-labelledby="discover-streams-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="discover-streams-heading" className="text-lg font-semibold tracking-tight">
            {liveCount > 0 ? "Live right now" : "Explore channels"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {liveCount > 0
              ? `${liveCount} ${liveCount === 1 ? "creator is" : "creators are"} broadcasting`
              : "Discover creators and check out their channels"}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{data.length} channels</span>
      </div>
      {data.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/15 px-6 py-12 text-center">
          <p className="font-medium">No channels to show yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back soon as creators join SchoolStream.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {data.map((result) => (
          <ResultCard key={result.id} data={result} />
        ))}
      </div>
    </section>
  );
}

export function ResultsSkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 h-6 w-40" />
      <Skeleton className="mb-5 h-4 w-64" />
      <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {[...Array(4)].map((_, i) => (
          <ResultCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
