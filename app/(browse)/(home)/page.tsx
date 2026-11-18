import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Radio, Sparkles } from "lucide-react";
import { Results, ResultsSkeleton } from "./_components/results";

export const metadata: Metadata = {
  title: "Discover live streams",
  description: "Find live creators, explore channels, and discover your next favorite stream.",
};

export default function Home() {
  return (
    <div className="mx-auto min-h-full w-full max-w-screen-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#292d3b] via-[#20232d] to-[#171920] px-5 py-7 shadow-xl sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Your next favorite stream starts here
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Discover live creators.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
            Explore live channels, find new communities, and watch the moments happening right now.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/80">
            <Radio className="h-4 w-4 text-rose-400" aria-hidden="true" />
            Live broadcasts and creator channels
          </div>
        </div>
      </section>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results />
      </Suspense>
    </div>
  );
}
