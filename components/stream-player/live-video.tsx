import React, { useEffect, useMemo, useRef, useState } from "react";
import { Participant, Track } from "livekit-client";
import { useTracks } from "@livekit/components-react";
import { useEventListener } from "usehooks-ts";
import { FullscreenControl } from "./fullscreen-control";
import { VolumeControl } from "./volume-control";

export function LiveVideo({ participant }: { participant: Participant }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(0);
  const onVolumeChange = (value: number) => {
    setVolume(+value);
    if (videoRef.current) { videoRef.current.muted = value === 0; videoRef.current.volume = +value * 0.01; }
  };
  const toggleMute = () => {
    const isMuted = volume === 0;
    setVolume(isMuted ? 50 : 0);
    if (videoRef.current) { videoRef.current.muted = !isMuted; videoRef.current.volume = isMuted ? 0.5 : 0; }
  };
  useEffect(() => { onVolumeChange(0); }, []);
  const toggleFullscreen = () => {
    if (isFullscreen) void document.exitFullscreen();
    else if (wrapperRef.current) void wrapperRef.current.requestFullscreen();
  };
  const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement !== null);
  useEventListener("fullscreenchange", handleFullscreenChange, wrapperRef);
  const trackReferences = useTracks([Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare]);
  const tracks = useMemo(() => trackReferences
    .filter((reference) => reference.participant.identity === participant.identity)
    .map((reference) => reference.publication.track)
    .filter((track): track is Track => !!track), [trackReferences, participant.identity]);
  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    tracks.forEach((track) => track.attach(element));
    return () => tracks.forEach((track) => track.detach(element));
  }, [tracks]);
  return <div ref={wrapperRef} className="relative h-full flex">
    <video ref={videoRef} width="100%" playsInline />
    <div className="absolute top-0 h-full w-full opacity-0 hover:opacity-100 hover:transition-all">
      <div className="absolute bottom-0 flex h-14 w-full items-center justify-between bg-gradient-to-r from-neutral-900 px-4">
        <VolumeControl onChange={onVolumeChange} value={volume} onToggle={toggleMute} />
        <FullscreenControl isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
      </div>
    </div>
  </div>;
}
