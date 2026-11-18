"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatInfo } from "./chat-info";

export function ChatForm({ value, isDelayed, isFollowersOnly, isFollowing, isHidden, isGuest, onChange, onSubmit }: {
  onSubmit: () => Promise<void>; onChange: (value: string) => void; value: string;
  isHidden: boolean; isFollowersOnly: boolean; isDelayed: boolean; isFollowing: boolean; isGuest: boolean;
}) {
  const [isSending, setIsSending] = useState(false);
  const isFollowersOnlyAndNotFollowing = isFollowersOnly && !isFollowing;
  const isDisabled = isHidden || isSending || isFollowersOnlyAndNotFollowing;
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!value.trim() || isDisabled) return;
    setIsSending(true);
    try { await onSubmit(); } finally { setIsSending(false); }
  };
  if (isHidden) return null;
  const placeholder = isFollowersOnlyAndNotFollowing
    ? isGuest ? "Sign in and follow this channel to chat" : "Follow this channel to chat"
    : "Send a message";
  return <form onSubmit={handleSubmit} className="flex flex-col items-center gap-y-4 p-3">
    <div className="w-full">
      <ChatInfo isDelayed={isDelayed} isFollowersOnly={isFollowersOnly} />
      <Input onChange={(e) => onChange(e.target.value)} value={value} disabled={isDisabled} maxLength={300}
        placeholder={placeholder} className={cn("border-white/10", (isFollowersOnly || isDelayed) && "rounded-t-none border-t-0")} />
    </div>
    <div className="ml-auto"><Button type="submit" variant="primary" size="sm" disabled={isDisabled}>{isSending ? "Sending…" : "Chat"}</Button></div>
  </form>;
}

export function ChatFormSkeleton() {
  return <div className="flex flex-col items-center gap-y-4 p-3"><Skeleton className="w-full h-10" /><div className="flex items-center gap-x-2 ml-auto"><Skeleton className="h-7 w-7" /><Skeleton className="h-7 w-12" /></div></div>;
}
