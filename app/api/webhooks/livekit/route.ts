import { RoomServiceClient, WebhookReceiver, type WebhookEvent } from "livekit-server-sdk";
import { db } from "@/lib/db";

const startViewerSessions = async (
  roomName: string,
  streamId: string,
  broadcastSessionId: string,
  apiUrl: string,
  apiKey: string,
  apiSecret: string,
) => {
  const roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret);
  const participants = await roomService.listParticipants(roomName);
  const viewers = participants.filter((participant) =>
    participant.identity !== `host-${roomName}` &&
    !participant.identity.startsWith(`browser-${roomName}-`) &&
    !participant.identity.startsWith(`ingress-${roomName}-`)
  );

  if (viewers.length) {
    await db.watchSession.createMany({
      data: viewers.map((participant) => ({
        streamId,
        broadcastSessionId,
        participantSid: participant.sid,
        participantIdentity: participant.identity,
        startedAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }
};

export async function POST(req: Request) {
  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const authorization = req.headers.get("Authorization");

  if (!apiKey || !apiSecret || !apiUrl) {
    console.error("LiveKit webhook credentials are not configured");
    return new Response("Webhook is not configured", { status: 500 });
  }
  if (!authorization) return new Response("Missing authorization header", { status: 400 });

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
    if (ingressId && event.event === "ingress_started") {
      await db.stream.updateMany({
        where: { ingressId, broadcastSource: "ingress", isLive: false },
        data: { isLive: true, broadcastLeaseExpiresAt: null },
      });
      const stream = await db.stream.findFirst({
        where: { ingressId, broadcastSource: "ingress", isLive: true },
        select: { id: true, userId: true, broadcastSessionId: true },
      });
      if (stream?.broadcastSessionId) {
        await startViewerSessions(stream.userId, stream.id, stream.broadcastSessionId, apiUrl, apiKey, apiSecret);
      }
    }

    if (ingressId && event.event === "ingress_ended") {
      const stream = await db.stream.findFirst({
        where: { ingressId, broadcastSource: "ingress" },
        select: { id: true, broadcastSessionId: true },
      });
      if (stream) {
        const ended = await db.stream.updateMany({
          where: { id: stream.id, ingressId, broadcastSource: "ingress" },
          data: { isLive: false, broadcastSource: null, broadcastSessionId: null, broadcastLeaseExpiresAt: null },
        });
        if (ended.count && stream.broadcastSessionId) {
          await db.watchSession.updateMany({
            where: { streamId: stream.id, broadcastSessionId: stream.broadcastSessionId, endedAt: null },
            data: { endedAt: new Date() },
          });
        }
      }
    }

    const roomName = event.room?.name;
    const participantIdentity = event.participant?.identity;
    const participantSid = event.participant?.sid;
    if (roomName && participantIdentity) {
      const browserPrefix = `browser-${roomName}-`;
      const ingressPrefix = `ingress-${roomName}-`;
      const source = participantIdentity.startsWith(browserPrefix)
        ? "browser"
        : participantIdentity.startsWith(ingressPrefix) ? "ingress" : null;
      const sessionId = source
        ? participantIdentity.slice(source === "browser" ? browserPrefix.length : ingressPrefix.length)
        : null;

      if (source && sessionId && event.event === "participant_joined") {
        await db.stream.updateMany({
          where: {
            userId: roomName,
            broadcastSource: source,
            broadcastSessionId: sessionId,
            isLive: false,
          },
          data: { isLive: true, broadcastLeaseExpiresAt: null },
        });
        // Also sync viewers who joined the room before the broadcaster went live.
        const stream = await db.stream.findUnique({
          where: { userId: roomName },
          select: { id: true, isLive: true, broadcastSource: true, broadcastSessionId: true },
        });
        if (stream?.isLive && stream.broadcastSource === source && stream.broadcastSessionId === sessionId) {
          await startViewerSessions(roomName, stream.id, sessionId, apiUrl, apiKey, apiSecret);
        }
      }

      if (source && sessionId && event.event === "participant_left") {
        const ended = await db.stream.updateMany({
          where: {
            userId: roomName,
            broadcastSource: source,
            broadcastSessionId: sessionId,
            isLive: true,
          },
          data: { isLive: false, broadcastSource: null, broadcastSessionId: null, broadcastLeaseExpiresAt: null },
        });
        if (ended.count) {
          const stream = await db.stream.findUnique({ where: { userId: roomName }, select: { id: true } });
          if (stream) {
            await db.watchSession.updateMany({
              where: { streamId: stream.id, broadcastSessionId: sessionId, endedAt: null },
              data: { endedAt: new Date() },
            });
          }
        }
      }

      // Track viewers only while a broadcaster is live. A viewer who joined
      // before the stream starts is picked up when the publisher joins above.
      if (!source && !participantIdentity.startsWith("host-") && participantSid &&
        (event.event === "participant_joined" || event.event === "participant_left")) {
        const stream = await db.stream.findUnique({
          where: { userId: roomName },
          select: { id: true, isLive: true, broadcastSessionId: true },
        });

        if (stream && event.event === "participant_joined" && stream.isLive && stream.broadcastSessionId) {
          await db.watchSession.upsert({
            where: {
              streamId_broadcastSessionId_participantSid: {
                streamId: stream.id,
                broadcastSessionId: stream.broadcastSessionId,
                participantSid,
              },
            },
            create: {
              streamId: stream.id,
              broadcastSessionId: stream.broadcastSessionId,
              participantSid,
              participantIdentity,
              startedAt: new Date(),
            },
            update: {},
          });
        }

        if (stream && event.event === "participant_left") {
          await db.watchSession.updateMany({
            where: { streamId: stream.id, participantSid, endedAt: null },
            data: { endedAt: new Date() },
          });
        }
      }
    }
  } catch (error) {
    console.error("LiveKit webhook processing failed", { eventType: event.event, error });
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response("Success", { status: 200 });
}
