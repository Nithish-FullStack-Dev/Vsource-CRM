"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/components/providers/socket-provider";

interface NotificationSocketPayload {
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

interface UnreadCountPayload {
  count: number;
}

interface UnreadCountResponse {
  count: number;
}

export function useNotificationSocket() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNewNotification = (notification: NotificationSocketPayload) => {
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const queryKey = query.queryKey;

            return (
              queryKey[0] === "notifications" && queryKey[1] !== "unread-count"
            );
          },
        },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== "object" || !("data" in oldData)) {
            return oldData;
          }

          const typedData = oldData as {
            data?: NotificationSocketPayload[];
            [key: string]: unknown;
          };

          const existingNotifications = Array.isArray(typedData.data)
            ? typedData.data
            : [];

          const alreadyExists = existingNotifications.some(
            (item) => item.id === notification.id,
          );

          if (alreadyExists) {
            return oldData;
          }

          return {
            ...typedData,
            data: [notification, ...existingNotifications].slice(0, 50),
          };
        },
      );

      queryClient.setQueriesData<UnreadCountResponse>(
        {
          predicate: (query) => {
            const queryKey = query.queryKey;

            return (
              queryKey[0] === "notifications" &&
              queryKey.includes("unread-count")
            );
          },
        },
        (oldData) => ({
          ...(oldData ?? {}),
          count: (oldData?.count ?? 0) + 1,
        }),
      );

      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
        refetchType: "active",
      });
    };

    const handleUnreadCount = ({ count }: UnreadCountPayload) => {
      queryClient.setQueriesData<UnreadCountResponse>(
        {
          predicate: (query) => {
            const queryKey = query.queryKey;

            return (
              queryKey[0] === "notifications" &&
              queryKey.includes("unread-count")
            );
          },
        },
        (oldData) => ({
          ...(oldData ?? {}),
          count,
        }),
      );
    };

    const handleNotificationRead = () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
        refetchType: "active",
      });
    };

    const handleNotificationArchived = () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
        refetchType: "active",
      });
    };

    const handleAllRead = () => {
      queryClient.setQueriesData<UnreadCountResponse>(
        {
          predicate: (query) => {
            const queryKey = query.queryKey;

            return (
              queryKey[0] === "notifications" &&
              queryKey.includes("unread-count")
            );
          },
        },
        (oldData) => ({
          ...(oldData ?? {}),
          count: 0,
        }),
      );

      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
        refetchType: "active",
      });
    };

    const handleReconnect = () => {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
        refetchType: "active",
      });
    };

    socket.on("notification:new", handleNewNotification);

    socket.on("notification:unread-count", handleUnreadCount);

    socket.on("notification:read", handleNotificationRead);

    socket.on("notification:archived", handleNotificationArchived);

    socket.on("notification:all-read", handleAllRead);

    socket.on("connect", handleReconnect);

    return () => {
      socket.off("notification:new", handleNewNotification);

      socket.off("notification:unread-count", handleUnreadCount);

      socket.off("notification:read", handleNotificationRead);

      socket.off("notification:archived", handleNotificationArchived);

      socket.off("notification:all-read", handleAllRead);

      socket.off("connect", handleReconnect);
    };
  }, [socket, queryClient]);
}
