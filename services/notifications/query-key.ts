// services/notifications/query-key.ts

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,

  lists: () => [...NOTIFICATION_KEYS.all, "list"] as const,

  list: (params: { filter: string; page: number; limit: number }) =>
    [
      ...NOTIFICATION_KEYS.lists(),
      params.filter,
      params.page,
      params.limit,
    ] as const,

  unreadCount: () => [...NOTIFICATION_KEYS.all, "unread-count"] as const,
};
