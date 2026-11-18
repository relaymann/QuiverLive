import React from "react";
import { getSelf } from "@/lib/auth-service";
import { getStreamByUserId } from "@/lib/stream-service";
import { db } from "@/lib/db";
import { ToggleCard } from "./_components/toggle-card";
import { BannedViewers } from "./_components/banned-viewers";
import { CommandManager } from "./_components/command-manager";

export default async function ChatPage() {
  const self = await getSelf();
  const stream = await getStreamByUserId(self.id);
  if (!stream) throw new Error("No stream found");

  const [bannedViewers, commands] = await Promise.all([
    db.chatModeration.findMany({
      where: { streamId: stream.id, isBanned: true },
      select: {
        participantIdentity: true,
        participantUser: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.chatCommand.findMany({
      where: { streamId: stream.id },
      select: { id: true, name: true, response: true, cooldownSeconds: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <div className="space-y-8 p-6">
    <section>
      <div className="mb-4"><h1 className="text-2xl font-bold">Chat settings</h1></div>
      <div className="space-y-4">
        <ToggleCard field="isChatEnabled" label="Enable chat" value={stream.isChatEnabled} />
        <ToggleCard field="isChatDelayed" label="Delay chat" value={stream.isChatDelayed} />
        <ToggleCard field="isChatFollowersOnly" label="Must be following to chat" value={stream.isChatFollowersOnly} />
      </div>
    </section>
    <section>
      <div className="mb-4"><h2 className="text-xl font-bold">Custom commands</h2><p className="mt-1 text-sm text-muted-foreground">Create chat commands that reply automatically when viewers type them.</p></div>
      <CommandManager commands={commands} />
    </section>
    <section>
      <div className="mb-4"><h2 className="text-xl font-bold">Banned viewers</h2><p className="mt-1 text-sm text-muted-foreground">Bans are tied to registered accounts. Guests can be timed out but cannot receive persistent bans.</p></div>
      <BannedViewers hostIdentity={self.id} viewers={bannedViewers} />
    </section>
  </div>;
}
