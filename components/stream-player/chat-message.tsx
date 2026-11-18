"use client";

import React from "react";
import { format } from "date-fns";
import { stringToColor } from "@/lib/utils";
import { QuiverLiveChatMessage } from "./chat-list";

export function ChatMessage({ data }: { data: QuiverLiveChatMessage }) {
  const color = stringToColor(data.from?.name || "");
  return <div className="flex gap-2 rounded-md p-2 hover:bg-white/5">
    <p className="shrink-0 text-sm text-white/40">{format(data.timestamp, "HH:mm")}</p>
    <div className="flex min-w-0 grow flex-wrap items-baseline gap-1">
      <p className="whitespace-nowrap text-sm font-semibold"><span className="truncate" style={{ color }}>{data.from?.name}</span>:</p>
      <p className="break-words text-sm">{data.message}</p>
    </div>
  </div>;
}
