import { WebhookReceiver } from "livekit-server-sdk";

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

  let event;
  try {
    const receiver = new WebhookReceiver(apiKey, apiSecret);
    event = receiver.receive(body, authorization);
  } catch (error) {
    console.error("LiveKit webhook signature verification failed", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const ingressId = event.ingressInfo?.ingressId;
  if (
    ingressId &&
    (event.event === "ingress_started" || event.event === "ingress_ended")
  ) {
    try {
      await db.stream.updateMany({
        where: { ingressId },
        data: { isLive: event.event === "ingress_started" },
      });
    } catch (error) {
      console.error("LiveKit webhook processing failed", {
        eventType: event.event,
        ingressId,
        error,
      });
      return new Response("Webhook processing failed", { status: 500 });
    }
  }

  return new Response("Success", { status: 200 });
}
