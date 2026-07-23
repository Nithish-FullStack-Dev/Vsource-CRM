import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  notificationService,
  NotificationFilter,
} from "@/services/notifications/notification.service";

import { NOTIFICATION_KEYS } from "@/services/notifications/query-key";

interface UseNotificationsParams {
  page?: number;
  limit?: number;
  filter?: NotificationFilter;
}

export const useNotifications = (params?: UseNotificationsParams) => {
  const page = params?.page ?? 1;
  const filter = params?.filter ?? "all";

  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(`${filter}-${page}`),

    queryFn: () => notificationService.getNotifications(params),

    staleTime: 30_000,

    placeholderData: keepPreviousData,

    refetchOnWindowFocus: true,

    refetchOnReconnect: true,
  });
};
