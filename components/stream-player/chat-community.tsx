"use client";

import React, { useMemo, useState } from "react";
import { useParticipants } from "@livekit/components-react";
import { useDebounce } from "usehooks-ts";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommunityItem } from "./community-item";

export function ChatCommunity({ hostIdentity, viewerIdentity, isHidden }: {
  hostIdentity: string; viewerIdentity: string; isHidden: boolean;
}) {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce<string>(value, 500);
  const participants = useParticipants();

  const filteredParticipants = useMemo(() => {
    const publisherPrefixes = [`browser-${hostIdentity}-`, `ingress-${hostIdentity}-`];
    return participants.filter((participant) =>
      !publisherPrefixes.some((prefix) => participant.identity.startsWith(prefix)) &&
      participant.identity !== hostIdentity &&
      participant.identity !== `host-${hostIdentity}` &&
      participant.identity !== viewerIdentity &&
      participant.name?.toLowerCase().includes(debouncedValue.toLowerCase())
    );
  }, [debouncedValue, participants, hostIdentity, viewerIdentity]);

  if (isHidden) return <div className="flex flex-1 items-center justify-center"><p className="text-sm text-muted-foreground">Community is offline</p></div>;

  return <div className="p-4">
    <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Search community" className="border-white/10" />
    <ScrollArea className="mt-4 h-[calc(100vh-180px)]">
      <p className="hidden text-center text-sm text-muted-foreground last:block">No results</p>
      {filteredParticipants.map((participant) => (
        <CommunityItem key={participant.identity} hostIdentity={hostIdentity} viewerIdentity={viewerIdentity}
          participantName={participant.name} participantIdentity={participant.identity} />
      ))}
    </ScrollArea>
  </div>;
}
