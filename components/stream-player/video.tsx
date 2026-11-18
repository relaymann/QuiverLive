"use client";

import React from "react";
import { ConnectionState, Track } from "livekit-client";
import { useConnectionState, useRemoteParticipant, useTracks } from "@livekit/components-react";
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
  const participant = useRemoteParticipant(hostIdentity);
  const trackReferences = useTracks(STREAM_SOURCES).filter(
    (reference) => reference.participant.identity === hostIdentity,
  );

  // Prefer a screen share when one is active; otherwise show the camera.
  // Audio tracks get separate elements so they cannot replace the video stream.
  const videoTrack =
    trackReferences.find((reference) => reference.source === Track.Source.ScreenShare)?.publication.track ??
    trackReferences.find((reference) => reference.source === Track.Source.Camera)?.publication.track;
  const audioTracks = trackReferences
    .filter((reference) =>
      reference.source === Track.Source.Microphone ||
      reference.source === Track.Source.ScreenShareAudio,
    )
    .map((reference) => reference.publication.track)
    .filter((track): track is Track => !!track);

  let content;
  if (!participant && connectionState === ConnectionState.Connected) {
    content = <OfflineVideo username={hostName} />;
  } else if (!participant || !videoTrack) {
    content = <LoadingVideo label={connectionState} />;
  } else {
    content = <LiveVideo videoTrack={videoTrack} audioTracks={audioTracks} />;
  }

  return <div className="group relative aspect-video border-b">{content}</div>;
}

export function VideoSkeleton() {
  return <div className="aspect-video border-x border-background"><Skeleton className="h-full w-full rounded-none" /></div>;
}
