import { useQuery } from "@tanstack/react-query";

import { notificationService } from "@/services/notifications/notification.service";

import { NOTIFICATION_KEYS } from "@/services/notifications/query-key";

export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),

    queryFn: () => notificationService.getUnreadCount(),

    staleTime: 30_000,

    refetchOnWindowFocus: true,

    refetchOnReconnect: true,
  });
}
