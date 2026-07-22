// hooks/notifications/useUnreadCount.ts

import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/notifications/notification.service";
import { NOTIFICATION_KEYS } from "@/services/notifications/query-key";

export const useUnreadCount = () => {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 4000, // Poll every 4 seconds for real-time unread count updates
    staleTime: 1000 * 2,
  });
};
