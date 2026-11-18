import React from "react";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";
import { LiveBadge } from "@/components/live-badge";
import { UserAvatar } from "@/components/user-avatar";

export function Thumbnail({
  src,
  fallback,
  isLive,
  username,
}: {
  src: string | null;
  fallback: string;
  isLive: boolean;
  username: string;
}) {
  let content;

  if (!src) {
    content = (
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-4 rounded-md bg-background transition-transform group-hover:-translate-y-1">
        <UserAvatar
          size="lg"
          showBadge
          username={username}
          imageUrl={fallback}
          isLive={isLive}
        />
      </div>
    );
  } else {
    content = (
      <Image
        src={src}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        quality={75}
        alt={`${username}'s stream thumbnail`}
        className="rounded-md object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
    );
  }

  return (
    <div className="group relative aspect-video cursor-pointer overflow-hidden rounded-md bg-white/5 ring-1 ring-white/10">
      {content}
      {isLive && (
        <div className="absolute left-2 top-2">
          <LiveBadge />
        </div>
      )}
    </div>
  );
}

export function ThumbnailSkeleton() {
  return (
    <div className="group relative aspect-video overflow-hidden rounded-xl">
      <Skeleton className="h-full w-full" />
    </div>
  );
}
