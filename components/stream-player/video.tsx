"use client";

import React from "react";
import { ConnectionState, Track } from "livekit-client";
import { useConnectionState, useParticipants, useTracks } from "@livekit/components-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OfflineVideo } from "./offline-video";
import { LoadingVideo } from "./loading-video";
import { LiveVideo } from "./live-video";

const STREAM_SOURCES = [
  Track.Source.Camera,
  Track.Source.Microphone,
  Track.Source.ScreenShare,
  Track.Source.ScreenShareAudio,
];

export function Video({ hostName, hostIdentity }: { hostName: string; hostIdentity: string }) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const publisherPrefixes = [`browser-${hostIdentity}-`, `ingress-${hostIdentity}-`];
  const isPublisher = (identity: string) => publisherPrefixes.some((prefix) => identity.startsWith(prefix));
  const participant = participants.find((item) => isPublisher(item.identity));
  const trackReferences = useTracks(STREAM_SOURCES).filter(
    (reference) => isPublisher(reference.participant.identity),
  );

  const videoTrack =
    trackReferences.find((reference) => reference.source === Track.Source.ScreenShare)?.publication.track ??
    trackReferences.find((reference) => reference.source === Track.Source.Camera)?.publication.track;
  const audioTracks = trackReferences
    .filter((reference) => reference.source === Track.Source.Microphone || reference.source === Track.Source.ScreenShareAudio)
    .map((reference) => reference.publication.track)
    .filter((track): track is Track => !!track);

  let content;
  if (!participant && connectionState === ConnectionState.Connected) content = <OfflineVideo username={hostName} />;
  else if (!participant || !videoTrack) content = <LoadingVideo label={connectionState} />;
  else content = <LiveVideo videoTrack={videoTrack} audioTracks={audioTracks} />;

  return <div className="group relative aspect-video border-b">{content}</div>;
}

export function VideoSkeleton() {
  return <div className="aspect-video border-x border-background"><Skeleton className="h-full w-full rounded-none" /></div>;
}
