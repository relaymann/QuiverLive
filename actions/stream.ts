"use server";

import { Stream } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

export const updateStream = async (values: Partial<Stream>) => {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    throw new Error("Invalid stream settings");
  }
  const self = await getSelf();
  const selfStream = await db.stream.findUnique({
    where: { userId: self.id },
    select: { id: true },
  });

  if (!selfStream) {
    throw new Error("No stream found");
  }

  const validData: {
    name?: string;
    thumbnailUrl?: string | null;
    isChatEnabled?: boolean;
    isChatFollowersOnly?: boolean;
    isChatDelayed?: boolean;
  } = {};

  if (values.name !== undefined) {
    if (typeof values.name !== "string") throw new Error("Invalid stream name");
    const name = values.name.trim();
    if (!name || name.length > 100) {
      throw new Error("Stream name must be between 1 and 100 characters");
    }
    validData.name = name;
  }

  if (values.thumbnailUrl !== undefined) {
    if (values.thumbnailUrl !== null) {
      if (typeof values.thumbnailUrl !== "string") throw new Error("Invalid thumbnail URL");
      let thumbnailUrl: URL;
      try {
        thumbnailUrl = new URL(values.thumbnailUrl);
      } catch {
        throw new Error("Invalid thumbnail URL");
      }
      if (
        thumbnailUrl.protocol !== "https:" ||
        thumbnailUrl.hostname !== "utfs.io"
      ) {
        throw new Error("Thumbnail must be hosted by UploadThing");
      }
    }
    validData.thumbnailUrl = values.thumbnailUrl;
  }

  for (const field of [
    "isChatEnabled",
    "isChatFollowersOnly",
    "isChatDelayed",
  ] as const) {
    const value = values[field];
    if (value !== undefined) {
      if (typeof value !== "boolean") {
        throw new Error("Invalid chat setting");
      }
      validData[field] = value;
    }
  }

  if (Object.keys(validData).length === 0) {
    throw new Error("No valid stream settings supplied");
  }

  const stream = await db.stream.update({
    where: { id: selfStream.id },
    data: validData,
    select: {
      id: true,
      name: true,
      thumbnailUrl: true,
      isChatEnabled: true,
      isChatFollowersOnly: true,
      isChatDelayed: true,
    },
  });

  revalidatePath(`/u/${self.username}/chat`);
  revalidatePath(`/u/${self.username}`);
  revalidatePath(`/${self.username}`);

  return stream;
};
