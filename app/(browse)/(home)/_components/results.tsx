import React from "react";
import { getStreams } from "@/lib/feed-service";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultCard, ResultCardSkeleton } from "../result-card";

export async function Results() {
  const data = await getStreams();
  const liveCount = data.filter((stream) => stream.isLive).length;
  return (
    <section aria-labelledby="discover-streams-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="discover-streams-heading" className="text-lg font-semibold tracking-tight">
            {liveCount > 0 ? "Live right now" : "Explore channels"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {liveCount > 0 ? `${liveCount} ${liveCount === 1 ? "creator is" : "creators are"} broadcasting` : "Discover creators and check out their channels"}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{data.length} channels</span>
      </div>
      {data.length === 0 && <div className="rounded-xl border border-dashed border-white/15 px-6 py-12 text-center"><p className="font-medium">No channels to show yet</p><p className="mt-1 text-sm text-muted-foreground">Channels will appear here when available.</p></div>}
      <div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{data.map((result) => <ResultCard key={result.id} data={result} />)}</div>
    </section>
  );
}
export function ResultsSkeleton() {
  return <div><Skeleton className="mb-2 h-6 w-40" /><Skeleton className="mb-5 h-4 w-64" /><div className="grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{[...Array(4)].map((_, i) => <ResultCardSkeleton key={i} />)}</div></div>;
}
