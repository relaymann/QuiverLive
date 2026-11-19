import React from "react";

import { getSearch } from "@/lib/search-service";
import { Skeleton } from "@/components/ui/skeleton";

import { ResultCard, ResultCardSkeleton } from "./result-card";

export async function Results({ term }: { term?: string }) {
  let data;
  try {
    data = await getSearch(term);
  } catch (error) {
    console.error("Search query failed:", error);
    return (
      <div role="alert" className="rounded-xl border border-white/10 p-6 text-center">
        <p className="font-medium">Search is temporarily unavailable</p>
        <p className="mt-2 text-sm text-muted-foreground">We couldn’t load search results. Please try again shortly.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        Results for term &quot;{term}&quot;
      </h2>
      {data.length === 0 && (
        <p className="text text-muted-foreground text-sm">
          No results found. Try searching for something else.
        </p>
      )}
      <div className="flex flex-col gap-y-4">
        {data.map((result) => (
          <ResultCard key={result.id} data={result} />
        ))}
      </div>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-[290px] mb-4" />
      <div className="flex flex-col gap-y-4">
        {[...Array(4)].map((_, i) => (
          <ResultCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
