import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { resetIngresses } from "@/lib/livekit-admin";

type ClerkWebhookData = { id: string; username?: string | null; image_url?: string | null };

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return new Response("Webhook is not configured", { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing webhook signature headers", { status: 400 });
  }

  const rawBody = await req.text();
  let event: WebhookEvent;
  try {
    event = new Webhook(webhookSecret).verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Clerk webhook signature verification failed", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const data = (event as unknown as { data: ClerkWebhookData }).data;
  if (!data?.id) return new Response("Invalid webhook payload", { status: 400 });

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const requestedUsername = data.username?.trim() || "user-" + data.id.slice(-8).toLowerCase();
      const collision = await db.user.findUnique({ where: { username: requestedUsername }, select: { externalUserId: true } });
      const username = collision && collision.externalUserId !== data.id
        ? requestedUsername.slice(0, 50) + "-" + data.id.slice(-8).toLowerCase()
        : requestedUsername;
      const imageUrl = data.image_url || "";
      await db.user.upsert({
        where: { externalUserId: data.id },
        create: {
          externalUserId: data.id, username, imageUrl,
          stream: { create: { name: username + "'s stream" } },
        },
        update: { username, imageUrl },
      });
    } else if (event.type === "user.deleted") {
      const user = await db.user.findUnique({ where: { externalUserId: data.id }, select: { id: true } });
      if (user) {
        await resetIngresses(user.id);
        await db.user.deleteMany({ where: { externalUserId: data.id } });
      }
    }
  } catch (error) {
    console.error("Clerk webhook processing failed", { eventType: event.type, error });
    return new Response("Webhook processing failed", { status: 500 });
  }
  return new Response(null, { status: 200 });
}
