"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatMessage } from "./chat-message";

export type QuiverLiveChatMessage = {
  id: string;
  timestamp: Date;
  message: string;
  from?: { name?: string; identity?: string };
};

export function ChatList({ isHidden, messages }: { messages: QuiverLiveChatMessage[]; isHidden: boolean }) {
  if (isHidden || !messages || messages.length === 0) return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-muted-foreground">{isHidden ? "Chat is disabled" : "Welcome to the chat!"}</p>
    </div>
  );
  return (
    <div className="flex h-full flex-1 flex-col-reverse overflow-y-auto p-3" aria-label="Live chat messages">
      {messages.map((message) => <ChatMessage key={message.id} data={message} />)}
    </div>
  );
}

export function ChatListSkeleton() {
  return <div className="flex h-full items-center justify-center"><Skeleton className="h-6 w-1/2" /></div>;
}
