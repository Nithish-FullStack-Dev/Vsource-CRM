// hooks/notifications/useMarkAllRead.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notifications/notification.service";
import { NOTIFICATION_KEYS } from "@/services/notifications/query-key";

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
};
