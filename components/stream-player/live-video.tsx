"use client";

import React, { useEffect, useRef, useState } from "react";
import { Track } from "livekit-client";
import { useEventListener } from "usehooks-ts";
import { FullscreenControl } from "./fullscreen-control";
import { VolumeControl } from "./volume-control";

function RemoteAudioTrack({ track, volume }: { track: Track; volume: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    track.attach(element);
    return () => { track.detach(element); };
  }, [track]);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    element.volume = volume / 100;
    element.muted = volume === 0;
  }, [volume]);

  return <audio ref={audioRef} autoPlay muted className="hidden" />;
}

export function LiveVideo({ videoTrack, audioTracks }: { videoTrack: Track; audioTracks: Track[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(0);

  const onVolumeChange = (value: number) => {
    setVolume(Math.max(0, Math.min(100, value)));
  };

  const toggleMute = () => setVolume((current) => current === 0 ? 50 : 0);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    videoTrack.attach(element);
    return () => { videoTrack.detach(element); };
  }, [videoTrack]);

  const toggleFullscreen = () => {
    if (isFullscreen) void document.exitFullscreen();
    else if (wrapperRef.current) void wrapperRef.current.requestFullscreen();
  };

  const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement !== null);
  useEventListener("fullscreenchange", handleFullscreenChange, wrapperRef);

  return (
    <div ref={wrapperRef} className="group relative flex h-full w-full items-center justify-center bg-black">
      <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-contain" />
      {audioTracks.map((track) => (
        <RemoteAudioTrack key={track.sid ?? track.mediaStreamTrack.id} track={track} volume={volume} />
      ))}
      <div className="absolute inset-x-0 bottom-0 flex h-14 items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-4 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <VolumeControl onChange={onVolumeChange} value={volume} onToggle={toggleMute} />
        <FullscreenControl isFullscreen={isFullscreen} onToggle={toggleFullscreen} />
      </div>
    </div>
  );
}
