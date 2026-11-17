"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useConnectionState, useRemoteParticipant, useRoomContext } from "@livekit/components-react";
import { Participant, RoomEvent, ConnectionState } from "livekit-client";
import { toast } from "sonner";
import { sendChatMessage } from "@/actions/chat";
import { ChatVariant, useChatSidebar } from "@/store/use-chat-sidebar";
import { ChatHeader, ChatHeaderSkeleton } from "./chat-header";
import { ChatForm, ChatFormSkeleton } from "./chat-form";
import { ChatList, ChatListSkeleton, SchoolStreamChatMessage } from "./chat-list";
import { ChatCommunity } from "./chat-community";

type ServerChatPacket = { id: string; message: string; timestamp: number; senderId: string; senderName: string };

export function Chat({ hostName, hostIdentity, viewerName, isFollowing, isChatEnabled, isChatDelayed, isChatFollowersOnly }: {
  hostName: string; hostIdentity: string; viewerName: string; isFollowing: boolean;
  isChatEnabled: boolean; isChatDelayed: boolean; isChatFollowersOnly: boolean;
}) {
  const matches = useMediaQuery("(max-width: 1024px)");
  const { variant, onExpand } = useChatSidebar((state) => state);
  const connectionState = useConnectionState();
  const participant = useRemoteParticipant(hostIdentity);
  const room = useRoomContext();
  const isOnline = participant && connectionState === ConnectionState.Connected;
  const isHidden = !isChatEnabled || !isOnline;
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<SchoolStreamChatMessage[]>([]);

  useEffect(() => {
    const onDataReceived = (payload: Uint8Array, sender?: Participant) => {
      // Only accept server-originated packets. This rejects messages sent by
      // still-valid older client tokens that may have had data publishing.
      if (sender) return;
      try {
        const packet = JSON.parse(new TextDecoder().decode(payload)) as Partial<ServerChatPacket>;
        if (typeof packet.id !== "string" || typeof packet.message !== "string" || typeof packet.timestamp !== "number") return;
        const item: SchoolStreamChatMessage = {
          id: packet.id, timestamp: new Date(packet.timestamp), message: packet.message,
          from: { name: packet.senderName || "Viewer", identity: packet.senderId },
        };
        setMessages((current) => [...current.slice(-99), item]);
      } catch { /* Ignore unrelated LiveKit packets. */ }
    };
    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => { room.off(RoomEvent.DataReceived, onDataReceived); };
  }, [room]);

  useEffect(() => { if (matches) onExpand(); }, [matches, onExpand]);
  const orderedMessages = useMemo(() => [...messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()), [messages]);

  const onSubmit = async () => {
    try { await sendChatMessage(hostIdentity, value); setValue(""); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to send your message"); }
  };

  return <div className="flex flex-col bg-background border-l border-b pt-0 h-[calc(100vh-80px)]">
    <ChatHeader />
    {variant === ChatVariant.CHAT && <>
      <ChatList messages={orderedMessages} isHidden={isHidden} />
      <ChatForm onSubmit={onSubmit} value={value} onChange={setValue} isHidden={isHidden}
        isFollowersOnly={isChatFollowersOnly} isDelayed={isChatDelayed} isFollowing={isFollowing} />
    </>}
    {variant === ChatVariant.COMMUNITY && <ChatCommunity hostName={hostName} viewerName={viewerName} isHidden={isHidden} />}
  </div>;
}

export function ChatSkeleton() {
  return <div className="flex flex-col border-l border-b pt-0 h-[calc(100vh-80px)] border-2"><ChatHeaderSkeleton /><ChatListSkeleton /><ChatFormSkeleton /></div>;
}
