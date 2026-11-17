import { WebhookReceiver, type WebhookEvent } from "livekit-server-sdk";

import { db } from "@/lib/db";

export async function POST(req: Request) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const authorization = req.headers.get("Authorization");

  if (!apiKey || !apiSecret) {
    console.error("LiveKit webhook credentials are not configured");
    return new Response("Webhook is not configured", { status: 500 });
  }

  if (!authorization) {
    return new Response("Missing authorization header", { status: 400 });
  }

  const body = await req.text();

  let event: WebhookEvent;
  try {
    const receiver = new WebhookReceiver(apiKey, apiSecret);
    event = receiver.receive(body, authorization);
  } catch (error) {
    console.error("LiveKit webhook signature verification failed", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  try {
    const ingressId = event.ingressInfo?.ingressId;
    if (
      ingressId &&
      (event.event === "ingress_started" || event.event === "ingress_ended")
    ) {
      await db.stream.updateMany({
        where: { ingressId },
        data: { isLive: event.event === "ingress_started" },
      });
    }

    // Browser broadcasts and RTMP/WHIP ingress use the channel's internal
    // user ID as the publishing participant identity. Viewer identities are
    // different, so they cannot accidentally toggle a channel's live state.
    const roomName = event.room?.name;
    const participantIdentity = event.participant?.identity;

    if (
      roomName &&
      participantIdentity === roomName &&
      event.event === "participant_joined"
    ) {
      await db.stream.updateMany({
        where: { userId: roomName },
        data: { isLive: true },
      });
    }

    if (
      roomName &&
      participantIdentity === roomName &&
      event.event === "participant_left"
    ) {
      await db.stream.updateMany({
        where: { userId: roomName },
        data: { isLive: false },
      });
    }
  } catch (error) {
    console.error("LiveKit webhook processing failed", {
      eventType: event.event,
      error,
    });
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response("Success", { status: 200 });
}
