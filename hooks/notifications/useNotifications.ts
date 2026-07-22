// hooks/notifications/useNotifications.ts

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  notificationService,
  NotificationFilter,
} from "@/services/notifications/notification.service";
import { NOTIFICATION_KEYS } from "@/services/notifications/query-key";

export const useNotifications = (params?: {
  page?: number;
  limit?: number;
  filter?: NotificationFilter;
}) => {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(
      params?.filter ? `${params.filter}-${params.page || 1}` : `all-${params?.page || 1}`
    ),
    queryFn: () => notificationService.getNotifications(params),
    refetchInterval: 4000, // Poll every 4 seconds for real-time notification list updates
    staleTime: 1000 * 2,
    placeholderData: keepPreviousData,
  });
};
