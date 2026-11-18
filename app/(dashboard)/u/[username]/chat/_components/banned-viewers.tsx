"use client";

import React, { useTransition } from "react";
import { toast } from "sonner";
import { unbanChatParticipant } from "@/actions/moderation";
import { Button } from "@/components/ui/button";

type BannedViewer = { participantIdentity: string; participantUser: { username: string } | null };

export function BannedViewers({ hostIdentity, viewers }: { hostIdentity: string; viewers: BannedViewer[] }) {
  const [isPending, startTransition] = useTransition();
  if (!viewers.length) return <p className="text-sm text-muted-foreground">No channel bans yet.</p>;

  const unban = (identity: string) => startTransition(() => {
    unbanChatParticipant(hostIdentity, identity)
      .then(() => toast.success("Viewer unbanned"))
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to unban viewer"));
  });

  return <div className="space-y-2">
    {viewers.map((viewer) => (
      <div key={viewer.participantIdentity} className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{viewer.participantUser?.username ?? "Guest viewer"}</p>
          <p className="truncate text-xs text-muted-foreground">{viewer.participantIdentity}</p>
        </div>
        <Button size="sm" variant="secondary" disabled={isPending} onClick={() => unban(viewer.participantIdentity)}>Unban</Button>
      </div>
    ))}
  </div>;
}
