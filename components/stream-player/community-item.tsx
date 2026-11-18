"use client";

import React, { useTransition } from "react";
import { toast } from "sonner";
import { Ban, Clock3, MinusCircle } from "lucide-react";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { onBlock } from "@/actions/block";
import { moderateChatParticipant } from "@/actions/moderation";
import { cn, stringToColor } from "@/lib/utils";

export function CommunityItem({ hostIdentity, viewerIdentity, participantName, participantIdentity }: {
  hostIdentity: string; viewerIdentity: string; participantName?: string; participantIdentity: string;
}) {
  const [isPending, startTransition] = useTransition();
  const color = stringToColor(participantName || "");
  const isHost = viewerIdentity === `host-${hostIdentity}`;
  const isSelf = participantIdentity === viewerIdentity;

  const runAction = (action: "timeout" | "ban") => startTransition(() => {
    moderateChatParticipant(hostIdentity, participantIdentity, action)
      .then(() => toast.success(action === "ban" ? `Banned ${participantName || "viewer"}` : `Timed out ${participantName || "viewer"} for 5 minutes`))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Moderation action failed"));
  });

  const handleBlock = () => startTransition(() => {
    onBlock(participantIdentity)
      .then(() => toast.success(`Blocked ${participantName || "viewer"}`))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to block viewer"));
  });

  return <div className={cn("group flex w-full items-center justify-between gap-2 rounded-md p-2 text-sm hover:bg-white/5", isPending && "pointer-events-none opacity-50")}>
    <p className="min-w-0 truncate" style={{ color }}>{participantName || "Viewer"}</p>
    {isHost && !isSelf && <div className="flex shrink-0 items-center gap-1">
      <Hint label="Timeout for 5 minutes"><Button variant="ghost" size="icon" disabled={isPending} onClick={() => runAction("timeout")} className="h-8 w-8"><Clock3 className="h-4 w-4" /></Button></Hint>
      <Hint label={participantIdentity.startsWith("guest-") ? "Persistent bans require an account" : "Ban from channel"}>
        <Button variant="ghost" size="icon" disabled={isPending || participantIdentity.startsWith("guest-")} onClick={() => runAction("ban")} className="h-8 w-8"><Ban className="h-4 w-4" /></Button>
      </Hint>
      <Hint label="Block"><Button variant="ghost" size="icon" disabled={isPending || participantIdentity.startsWith("guest-")} onClick={handleBlock} className="h-8 w-8"><MinusCircle className="h-4 w-4" /></Button></Hint>
    </div>}
  </div>;
}
