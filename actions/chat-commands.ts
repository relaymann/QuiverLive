"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSelf } from "@/lib/auth-service";

const normalizeName = (value: string) => value.trim().replace(/^!/, "").toLowerCase();
const reservedNames = new Set(["watchtime", "followage"]);

const getOwnedStream = async () => {
  const self = await getSelf();
  const stream = await db.stream.findUnique({ where: { userId: self.id }, select: { id: true } });
  if (!stream) throw new Error("No stream found");
  return { self, stream };
};

const refresh = (username: string) => {
  revalidatePath(`/u/${username}/chat`);
};

export const createChatCommand = async (input: {
  name: string;
  response: string;
  cooldownSeconds: number;
}) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid command");
  if (typeof input.name !== "string" || typeof input.response !== "string") {
    throw new Error("Invalid command");
  }
  const { self, stream } = await getOwnedStream();
  const name = normalizeName(input.name);
  const response = input.response.trim();
  const cooldownSeconds = Number(input.cooldownSeconds);
  if (!/^[a-z0-9_]{1,32}$/.test(name)) throw new Error("Use 1–32 letters, numbers, or underscores for the command name");
  if (reservedNames.has(name)) throw new Error("That command name is reserved");
  if (!response || response.length > 500) throw new Error("Responses must be between 1 and 500 characters");
  if (!Number.isInteger(cooldownSeconds) || cooldownSeconds < 0 || cooldownSeconds > 3600) {
    throw new Error("Cooldown must be between 0 and 3600 seconds");
  }

  await db.chatCommand.create({
    data: { streamId: stream.id, name, response, cooldownSeconds },
  });
  refresh(self.username);
  return { success: true };
};

export const deleteChatCommand = async (commandId: string) => {
  if (typeof commandId !== "string" || commandId.length > 64) throw new Error("Invalid command");
  const { self, stream } = await getOwnedStream();
  const deleted = await db.chatCommand.deleteMany({
    where: { id: commandId, streamId: stream.id },
  });
  if (deleted.count !== 1) throw new Error("Command not found");
  refresh(self.username);
  return { success: true };
};
