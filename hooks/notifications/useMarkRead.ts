// hooks/notifications/useMarkRead.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notifications/notification.service";
import { NOTIFICATION_KEYS } from "@/services/notifications/query-key";

export const useMarkRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
};
