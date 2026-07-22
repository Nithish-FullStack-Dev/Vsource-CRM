"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckCheck,
  Loader2,
  Inbox,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationFilter } from "@/services/notifications/notification.service";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { useUnreadCount } from "@/hooks/notifications/useUnreadCount";
import { useMarkAllRead } from "@/hooks/notifications/useMarkAllRead";
import { useDeleteAllNotifications } from "@/hooks/notifications/useDeleteAllNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: notificationsData, isLoading } = useNotifications({
    page,
    limit: 20,
    filter,
  });

  const { data: unreadData } = useUnreadCount();
  const markAllRead = useMarkAllRead();
  const deleteAll = useDeleteAllNotifications();

  const notifications = notificationsData?.data ?? [];
  const meta = notificationsData?.meta;
  const unreadCount = unreadData?.count ?? 0;

  const handleTabChange = (val: string) => {
    setFilter(val as NotificationFilter);
    setPage(1);
  };

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all notifications? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAll.mutateAsync();
    } catch (err) {
      console.error("Failed to delete notifications", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="size-6 text-primary" />
            Notifications Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated with lead activities, status changes, applications, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="gap-2"
            >
              {markAllRead.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCheck className="size-4 text-blue-500" />
              )}
              Mark all as read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              disabled={isDeleting || deleteAll.isPending}
              className="gap-2"
            >
              {isDeleting || deleteAll.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete All Notifications
            </Button>
          )}
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="flex items-center justify-between gap-4">
        <Tabs defaultValue="all" value={filter} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3 w-[300px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main List Card */}
      <Card className="p-4 shadow-sm border border-border">
        {isLoading ? (
          <div className="space-y-4 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Inbox className="size-12 stroke-1 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No notifications found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === "unread"
                ? "You have no unread notifications right now."
                : filter === "archived"
                ? "You have no archived notifications."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-1 divide-y divide-border/40">
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                showArchiveAction={true}
              />
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4 px-2">
            <p className="text-xs text-muted-foreground">
              Showing page <span className="font-semibold">{meta.page}</span> of{" "}
              <span className="font-semibold">{meta.totalPages}</span> ({meta.total} total)
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 gap-1"
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="h-8 gap-1"
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
