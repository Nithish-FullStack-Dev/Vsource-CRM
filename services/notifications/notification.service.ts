// services/notifications/notification.service.ts

import { api } from "@/lib/api";

export interface NotificationItem {
  id: string;
  eventKey: string;
  entityType: string | null;
  entityId: string | null;
  title: string;
  message: string;
  actionUrl: string | null;
  icon: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  actor: { id: string; name: string } | null;
}

export interface NotificationListResponse {
  success: boolean;
  data: NotificationItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

export type NotificationFilter = "all" | "unread";

export const notificationService = {
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    filter?: NotificationFilter;
  }) {
    const res = await api.get("/notifications", {
      params: {
        page: params?.page,
        limit: params?.limit,
        filter: params?.filter,
      },
    });

    return res.data;
  },
  async getUnreadCount() {
    const { data } = await api.get<UnreadCountResponse>(
      "/notifications/unread-count",
    );
    return data.data;
  },

  async markRead(id: string) {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  async markAllRead() {
    const { data } = await api.patch("/notifications/mark-all-read");
    return data;
  },

  async archive(id: string) {
    const { data } = await api.patch(`/notifications/${id}/archive`);
    return data;
  },

  async deleteAll() {
    const { data } = await api.delete("/notifications");
    return data;
  },
  async delete(id: string) {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};
