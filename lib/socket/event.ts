export interface NotificationSocketPayload {
  id: string;
  eventId: string;
  eventKey: string;
  entityType: string;
  entityId: string;

  title: string;
  message: string;

  actionUrl: string | null;
  icon: string | null;

  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";

  metadata: Record<string, unknown> | null;

  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;

  actor: {
    id: string;
    name: string;
  } | null;
}

export interface ServerToClientEvents {
  "socket:ready": (payload: { userId: string; connectedAt: string }) => void;

  "notification:new": (notification: NotificationSocketPayload) => void;

  "notification:read": (payload: {
    notificationId: string;
    readAt: string;
  }) => void;

  "notification:archived": (payload: {
    notificationId: string;
    archivedAt: string;
  }) => void;

  "notification:all-read": (payload: { readAt: string }) => void;

  "notification:unread-count": (payload: { count: number }) => void;
}

export interface ClientToServerEvents {
  "socket:ping": (
    acknowledgement: (response: { ok: true; timestamp: string }) => void,
  ) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
  userName: string;
  roleName: string;
  branchIds: string[];
}
