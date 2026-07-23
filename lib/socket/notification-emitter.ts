import { SOCKET_ROOMS } from "@/lib/socket/rooms";
import { getSocketEmitter } from "@/lib/socket/server-emitter";

import type { NotificationSocketPayload } from "@/lib/socket/event";

export async function emitNotificationToUser(
  recipientId: string,
  notification: NotificationSocketPayload,
): Promise<void> {
  const emitter = await getSocketEmitter();

  emitter
    .to(SOCKET_ROOMS.user(recipientId))
    .emit("notification:new", notification);
}

export async function emitUnreadCountToUser(
  recipientId: string,
  count: number,
): Promise<void> {
  const emitter = await getSocketEmitter();

  emitter.to(SOCKET_ROOMS.user(recipientId)).emit("notification:unread-count", {
    count,
  });
}
