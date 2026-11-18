"use server";

import {
  IngressAudioEncodingPreset,
  IngressInput,
  IngressClient,
  IngressVideoEncodingPreset,
  type CreateIngressOptions,
} from "livekit-server-sdk";
import { TrackSource } from "livekit-server-sdk/dist/proto/livekit_models";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";
import { resetIngresses } from "@/lib/livekit-admin";
import { releaseBroadcastReservation, reserveBroadcast } from "@/lib/broadcast-reservation";

export const createIngress = async (ingressType: IngressInput) => {
  const self = await getSelf();
  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiUrl || !apiKey || !apiSecret) throw new Error("LiveKit server credentials are not configured");
  if (ingressType !== IngressInput.RTMP_INPUT && ingressType !== IngressInput.WHIP_INPUT) {
    throw new Error("Unsupported ingress type");
  }

  const stream = await db.stream.findUnique({
    where: { userId: self.id },
    select: { id: true, isLive: true, broadcastSource: true, broadcastSessionId: true },
  });
  if (!stream) throw new Error("No stream is configured for this account");
  if (stream.isLive) throw new Error("Your channel is already live. End the current broadcast before changing its ingest connection.");
  if (stream.broadcastSource === "ingress" && stream.broadcastSessionId) {
    await releaseBroadcastReservation(self.id, stream.broadcastSessionId, "ingress");
  }

  const sessionId = await reserveBroadcast(self.id, "ingress");
  const ingressClient = new IngressClient(apiUrl, apiKey, apiSecret);
  let createdIngressId: string | null = null;

  try {
    await resetIngresses(self.id);
    await db.stream.update({
      where: { id: stream.id },
      data: { ingressId: null, serverUrl: null, streamKey: null },
    });

    const options: CreateIngressOptions = {
      name: self.username,
      roomName: self.id,
      participantName: self.username,
      participantIdentity: `ingress-${self.id}-${sessionId}`,
    };

    if (ingressType === IngressInput.WHIP_INPUT) {
      options.bypassTranscoding = true;
    } else {
      options.video = {
        source: TrackSource.CAMERA,
        preset: IngressVideoEncodingPreset.H264_1080P_30FPS_3_LAYERS,
      };
      options.audio = {
        source: TrackSource.MICROPHONE,
        preset: IngressAudioEncodingPreset.OPUS_STEREO_96KBPS,
      };
    }

    const ingress = await ingressClient.createIngress(ingressType, options);
    createdIngressId = ingress?.ingressId ?? null;
    if (!ingress?.ingressId || !ingress.url || !ingress.streamKey) throw new Error("Failed to create ingress");

    await db.stream.update({
      where: { userId: self.id },
      data: { ingressId: ingress.ingressId, serverUrl: ingress.url, streamKey: ingress.streamKey },
    });

    revalidatePath(`/u/${self.username}/keys`);
    return ingress;
  } catch (error) {
    if (createdIngressId) {
      try { await ingressClient.deleteIngress(createdIngressId); } catch { /* Best-effort cleanup. */ }
    }
    await releaseBroadcastReservation(self.id, sessionId, "ingress");
    throw error;
  }
};
