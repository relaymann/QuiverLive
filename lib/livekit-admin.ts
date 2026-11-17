import "server-only";

import { IngressClient, RoomServiceClient } from "livekit-server-sdk";

/**
 * Removes the LiveKit room and ingress resources belonging to an internal
 * SchoolStream user ID. This module is server-only and is deliberately not a
 * Next.js server-action module: callers must establish ownership/authorization.
 */
export const resetIngresses = async (internalUserId: string) => {
  if (!internalUserId || typeof internalUserId !== "string") {
    throw new Error("A valid internal user ID is required");
  }

  const apiUrl = process.env.LIVEKIT_API_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiUrl || !apiKey || !apiSecret) {
    throw new Error("LiveKit server credentials are not configured");
  }

  const ingressClient = new IngressClient(apiUrl);
  const roomService = new RoomServiceClient(apiUrl, apiKey, apiSecret);

  const ingresses = await ingressClient.listIngress({ roomName: internalUserId });
  // Stop ingress resources before removing their destination room.
  for (const ingress of ingresses) {
    if (ingress.ingressId) {
      await ingressClient.deleteIngress(ingress.ingressId);
    }
  }

  const rooms = await roomService.listRooms([internalUserId]);
  for (const room of rooms) {
    await roomService.deleteRoom(room.name);
  }
};
