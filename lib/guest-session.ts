import "server-only";

import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "quiverlive_guest";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const secret = () => {
  const value = process.env.LIVEKIT_API_SECRET;
  if (!value) throw new Error("Guest sessions are not configured");
  return value;
};

const sign = (identity: string) => createHmac("sha256", secret()).update(identity).digest("hex");

const parse = (value?: string) => {
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const identity = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!identity.startsWith("guest-") || signature.length !== 64) return null;
  const expected = Buffer.from(sign(identity), "hex");
  const supplied = Buffer.from(signature, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  return identity;
};

export const getOrCreateGuestIdentity = async () => {
  const store = await cookies();
  const existing = parse(store.get(COOKIE_NAME)?.value);
  if (existing) return { id: existing, username: `Guest-${existing.slice(-6)}` };

  const identity = `guest-${randomUUID()}`;
  store.set(COOKIE_NAME, `${identity}.${sign(identity)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return { id: identity, username: `Guest-${identity.slice(-6)}` };
};

export const getGuestIdentity = async () => {
  const store = await cookies();
  const identity = parse(store.get(COOKIE_NAME)?.value);
  if (!identity) throw new Error("Your guest session expired. Refresh the stream to reconnect.");
  return { id: identity, username: `Guest-${identity.slice(-6)}` };
};
