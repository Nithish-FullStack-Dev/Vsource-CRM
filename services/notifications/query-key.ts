// services/notifications/query-key.ts

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  lists: () => [...NOTIFICATION_KEYS.all, "list"] as const,
  list: (filter?: string) => [...NOTIFICATION_KEYS.lists(), filter] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, "unread-count"] as const,
};
