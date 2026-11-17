"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createLocalScreenTracks, createLocalTracks, LocalTrack, LocalVideoTrack, Room, Track } from "livekit-client";
import { Camera, MonitorUp, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { assertCanStartBrowserBroadcast } from "@/actions/token";

type BroadcastStatus = "idle" | "starting" | "live";
type Quality = "360p" | "540p" | "720p";
const DIMENSIONS: Record<Quality, { width: number; height: number }> = {
  "360p": { width: 640, height: 360 }, "540p": { width: 960, height: 540 }, "720p": { width: 1280, height: 720 },
};

export function BrowserBroadcast({ token, hostIdentity }: { token: string; hostIdentity: string }) {
  const roomRef = useRef<Room | null>(null);
  const tracksRef = useRef<LocalTrack[]>([]);
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

  const stopBroadcast = useCallback(async () => {
    const room = roomRef.current;
    const tracks = tracksRef.current;
    tracks.forEach((track) => { if (room) void room.localParticipant.unpublishTrack(track); track.stop(); });
    if (room) await room.disconnect();
    roomRef.current = null; tracksRef.current = []; setPreviewTrack(null); setStatus("idle");
  }, []);

  useEffect(() => () => {
    const room = roomRef.current;
    tracksRef.current.forEach((track) => { if (room) void room.localParticipant.unpublishTrack(track); track.stop(); });
    if (room) void room.disconnect();
  }, []);

  const startBroadcast = async (mode: "camera" | "screen") => {
    if (status !== "idle") return;
    setStatus("starting");
    let room: Room | null = null;
    let tracks: LocalTrack[] = [];
    try {
      const resolution = { ...DIMENSIONS[quality], frameRate: mode === "screen" ? Math.min(frameRate, 15) : frameRate };
      tracks = mode === "camera"
        ? await createLocalTracks({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: { resolution, facingMode: "user" } })
        : await createLocalScreenTracks({ audio: true, resolution });
      const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;
      if (!serverUrl) throw new Error("LiveKit is not configured for browser broadcasting");
      tracksRef.current = tracks;
      await assertCanStartBrowserBroadcast(hostIdentity);
      room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;
      await room.connect(serverUrl, token);
      for (const track of tracks) await room.localParticipant.publishTrack(track);
      const videoTrack = tracks.find((track) => track.kind === Track.Kind.Video) as LocalVideoTrack | undefined;
      if (videoTrack) {
        setPreviewTrack(videoTrack);
        videoTrack.mediaStreamTrack.addEventListener("ended", () => void stopBroadcast(), { once: true });
      }
      setStatus("live");
      toast.success(mode === "camera" ? "Camera is live" : "Screen is live");
    } catch (error) {
      tracks.forEach((track) => track.stop());
      if (room) await room.disconnect();
      roomRef.current = null; tracksRef.current = []; setPreviewTrack(null); setStatus("idle");
      console.error("Browser broadcast failed", error);
      toast.error(error instanceof Error ? error.message : "Unable to start your broadcast");
    }
  };

  return <section className="rounded-xl border bg-background p-4 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold">Browser broadcasting</h2><p className="text-sm text-muted-foreground">Go live with your camera or share your screen. No OBS required.</p></div>
      <span className={status === "live" ? "text-xs font-semibold text-rose-500" : "text-xs text-muted-foreground"} aria-live="polite">{status === "live" ? "LIVE" : status === "starting" ? "Connecting…" : "Offline"}</span>
    </div>
    {previewTrack && <div className="overflow-hidden rounded-lg bg-black aspect-video"><video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-contain" /></div>}
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">Video quality
        <select className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" value={quality} onChange={(e) => setQuality(e.target.value as Quality)} disabled={status !== "idle"}>
          <option value="360p">360p · low-power</option><option value="540p">540p · balanced</option><option value="720p">720p · higher detail</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">Camera frame rate
        <select className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" value={frameRate} onChange={(e) => setFrameRate(Number(e.target.value))} disabled={status !== "idle"}>
          <option value={15}>15 FPS · low CPU</option><option value={24}>24 FPS · balanced</option><option value={30}>30 FPS · smoother</option>
        </select>
      </label>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => void startBroadcast("camera")} disabled={status !== "idle"}><Camera className="mr-2 h-4 w-4" />Start camera</Button>
      <Button type="button" variant="secondary" onClick={() => void startBroadcast("screen")} disabled={status !== "idle"}><MonitorUp className="mr-2 h-4 w-4" />Share screen</Button>
      {status !== "idle" && <Button type="button" variant="destructive" onClick={() => void stopBroadcast()} disabled={status === "starting"}><Square className="mr-2 h-4 w-4" />Stop broadcast</Button>}
    </div>
    <p className="text-xs text-muted-foreground">Screen sharing is capped at 15 FPS to reduce Chromebook CPU and network load. School policies may restrict capture permissions.</p>
  </section>;
}
