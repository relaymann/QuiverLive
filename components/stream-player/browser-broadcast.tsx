"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createLocalScreenTracks, createLocalTracks, LocalTrack, LocalVideoTrack, Room, RoomEvent, Track } from "livekit-client";
import { Camera, MonitorUp, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createBroadcasterToken, releaseBrowserBroadcast, reserveBrowserBroadcast } from "@/actions/token";

type BroadcastStatus = "idle" | "starting" | "live" | "reconnecting";
type Quality = "360p" | "540p" | "720p";
const DIMENSIONS: Record<Quality, { width: number; height: number }> = {
  "360p": { width: 640, height: 360 },
  "540p": { width: 960, height: 540 },
  "720p": { width: 1280, height: 720 },
};

export function BrowserBroadcast({ hostIdentity }: { hostIdentity: string }) {
  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<LocalTrack[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<BroadcastStatus>("idle");
  const [previewTrack, setPreviewTrack] = useState<LocalVideoTrack | null>(null);
  const [quality, setQuality] = useState<Quality>("360p");
  const [frameRate, setFrameRate] = useState(24);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!previewTrack || !videoElement) return;
    previewTrack.attach(videoElement);
    return () => { previewTrack.detach(videoElement); };
  }, [previewTrack]);

  const releaseSession = useCallback(async (sessionId: string | null) => {
    if (!sessionId) return;
    if (sessionIdRef.current === sessionId) sessionIdRef.current = null;
    try { await releaseBrowserBroadcast(hostIdentity, sessionId); }
    catch (error) { console.error("Unable to release browser broadcast reservation", error); }
  }, [hostIdentity]);

  const stopBroadcast = useCallback(async () => {
    const room = roomRef.current;
    const tracks = tracksRef.current;
    const sessionId = sessionIdRef.current;
    roomRef.current = null;
    tracksRef.current = [];
    sessionIdRef.current = null;
    tracks.forEach((track) => {
      if (room) void room.localParticipant.unpublishTrack(track);
      track.stop();
    });
    if (room) await room.disconnect();
    setPreviewTrack(null);
    setStatus("idle");
    await releaseSession(sessionId);
  }, [releaseSession]);

  useEffect(() => () => {
    const room = roomRef.current;
    roomRef.current = null;
    const tracks = tracksRef.current;
    tracksRef.current = [];
    tracks.forEach((track) => {
      if (room) void room.localParticipant.unpublishTrack(track);
      track.stop();
    });
    if (room) void room.disconnect();
    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (sessionId) void releaseBrowserBroadcast(hostIdentity, sessionId);
  }, [hostIdentity]);

  const startBroadcast = async (mode: "camera" | "screen") => {
    if (status !== "idle") return;
    setStatus("starting");
    let room: Room | null = null;
    let tracks: LocalTrack[] = [];
    let sessionId: string | null = null;

    try {
      const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;
      if (!serverUrl) throw new Error("LiveKit is not configured for browser broadcasting");

      // Capture first: declining permissions must not invalidate an existing OBS setup.
      const resolution = {
        ...DIMENSIONS[quality],
        frameRate: mode === "screen" ? Math.min(frameRate, 15) : frameRate,
      };
      tracks = mode === "camera"
        ? await createLocalTracks({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: { resolution, facingMode: "user" },
          })
        : await createLocalScreenTracks({ audio: true, resolution });

      // Atomically reserve the channel after permission succeeds. This blocks
      // competing OBS/WHIP/RTMP creation and removes any idle ingress resource.
      sessionId = await reserveBrowserBroadcast(hostIdentity);
      sessionIdRef.current = sessionId;
      tracksRef.current = tracks;
      room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      tracks.forEach((track) => {
        track.mediaStreamTrack.addEventListener("ended", () => {
          if (roomRef.current === room) void stopBroadcast();
        }, { once: true });
      });

      room.on(RoomEvent.Reconnecting, () => {
        if (roomRef.current === room) setStatus("reconnecting");
      });
      room.on(RoomEvent.Reconnected, () => {
        if (roomRef.current === room) setStatus("live");
      });
      room.on(RoomEvent.Disconnected, () => {
        if (roomRef.current !== room) return;
        roomRef.current = null;
        tracksRef.current = [];
        tracks.forEach((track) => track.stop());
        setPreviewTrack(null);
        setStatus("idle");
        void releaseSession(sessionId);
        toast.error("Your broadcast connection was lost. Start again when your connection is stable.");
      });

      const broadcasterToken = await createBroadcasterToken(hostIdentity, sessionId);
      if (roomRef.current !== room) return;
      await room.connect(serverUrl, broadcasterToken);
      if (roomRef.current !== room) return;

      for (const track of tracks) {
        await room.localParticipant.publishTrack(track);
        if (roomRef.current !== room) return;
      }

      const videoTrack = tracks.find((track) => track.kind === Track.Kind.Video) as LocalVideoTrack | undefined;
      if (videoTrack) setPreviewTrack(videoTrack);
      setStatus("live");
      toast.success(mode === "camera" ? "Camera broadcast is live" : "Screen broadcast is live");
    } catch (error) {
      tracks.forEach((track) => track.stop());
      if (roomRef.current === room) roomRef.current = null;
      if (tracksRef.current === tracks) tracksRef.current = [];
      if (room) await room.disconnect();
      setPreviewTrack(null);
      setStatus("idle");
      await releaseSession(sessionId);
      console.error("Browser broadcast failed", error);
      toast.error(error instanceof Error ? error.message : "Unable to start your broadcast");
    }
  };

  return <section className="space-y-4 rounded-xl border border-white/10 bg-background p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="font-semibold">Broadcast from your browser</h2><p className="mt-1 text-sm text-muted-foreground">Go live with your camera and microphone or share your screen. No encoder required.</p></div>
      <span className={status === "live" ? "text-xs font-semibold text-rose-500" : "text-xs text-muted-foreground"} aria-live="polite">
        {status === "live" ? "LIVE" : status === "reconnecting" ? "Reconnecting…" : status === "starting" ? "Connecting…" : "Offline"}
      </span>
    </div>
    {previewTrack && <div className="aspect-video overflow-hidden rounded-lg bg-black"><video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-contain" /></div>}
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">Video quality
        <select className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" value={quality} onChange={(e) => setQuality(e.target.value as Quality)} disabled={status !== "idle"}>
          <option value="360p">360p · lower bandwidth</option><option value="540p">540p · balanced</option><option value="720p">720p · higher detail</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">Camera frame rate
        <select className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" value={frameRate} onChange={(e) => setFrameRate(Number(e.target.value))} disabled={status !== "idle"}>
          <option value={15}>15 FPS · lower CPU</option><option value={24}>24 FPS · balanced</option><option value={30}>30 FPS · smoother</option>
        </select>
      </label>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => void startBroadcast("camera")} disabled={status !== "idle"}><Camera className="mr-2 h-4 w-4" />Start camera</Button>
      <Button type="button" variant="secondary" onClick={() => void startBroadcast("screen")} disabled={status !== "idle"}><MonitorUp className="mr-2 h-4 w-4" />Share screen</Button>
      {status !== "idle" && <Button type="button" variant="destructive" onClick={() => void stopBroadcast()} disabled={status === "starting"}><Square className="mr-2 h-4 w-4" />Stop broadcast</Button>}
    </div>
    <p className="text-xs leading-5 text-muted-foreground">Screen sharing is capped at 15 FPS by default to reduce CPU and bandwidth use. Available capture options depend on your browser and device.</p>
  </section>;
}
