import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import { resetIngresses } from "@/lib/livekit-admin";

type ClerkWebhookData = {
  id: string;
  username?: string | null;
  image_url?: string | null;
};

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return new Response("Webhook is not configured", { status: 500 });
  }

  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing webhook signature headers", { status: 400 });
  }

  // Svix signatures cover the exact bytes sent by Clerk. Do not parse and
  // re-stringify JSON before verification.
  const rawBody = await req.text();
  const webhook = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    event = webhook.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Clerk webhook signature verification failed", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const data = (event as unknown as { data: ClerkWebhookData }).data;
  if (!data?.id) {
    return new Response("Invalid webhook payload", { status: 400 });
  }

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const username =
        data.username?.trim() || `user-${data.id.slice(-8).toLowerCase()}`;
      const imageUrl = data.image_url || "";

      await db.user.upsert({
        where: { externalUserId: data.id },
        create: {
          externalUserId: data.id,
          username,
          imageUrl,
          stream: {
            create: { name: `${username}'s stream` },
          },
        },
        update: {
          username,
          imageUrl,
        },
      });
    } else if (event.type === "user.deleted") {
      const user = await db.user.findUnique({
        where: { externalUserId: data.id },
        select: { id: true },
      });

      if (user) {
        // Use the internal database ID: LiveKit room names are not Clerk IDs.
        await resetIngresses(user.id);
        await db.user.deleteMany({
          where: { externalUserId: data.id },
        });
      }
    }
  } catch (error) {
    // Return a retryable error so Clerk can redeliver events after outages.
    console.error("Clerk webhook processing failed", {
      eventType: event.type,
      error,
    });
    return new Response("Webhook processing failed", { status: 500 });
  }

  return new Response(null, { status: 200 });
}
