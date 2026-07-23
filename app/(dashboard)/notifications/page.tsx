// app\(dashboard)\notifications\page.tsx
"use client";

import React, { useEffect, useState } from "react";
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
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useDeleteAllNotifications } from "@/hooks/notifications/useDeleteAllNotifications";
import { useDeleteNotification } from "@/hooks/notifications/useDeleteNotification";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const { data: notificationsData, isLoading } = useNotifications({
    page,
    limit: 20,
    filter,
  });

  const { data: unreadData } = useUnreadCount();
  const markAllRead = useMarkAllRead();
  const deleteAll = useDeleteAllNotifications();
  const deleteNotification = useDeleteNotification();
  const notifications = notificationsData?.data ?? [];
  const meta = notificationsData?.meta;
  useEffect(() => {
    if (!meta) return;

    if (meta.totalPages === 0) {
      setPage(1);
      return;
    }

    if (page > meta.totalPages) {
      setPage(meta.totalPages);
    }
  }, [meta, page]);
  const unreadCount = unreadData?.count ?? 0;

  const handleTabChange = (val: string) => {
    setFilter(val as NotificationFilter);
    setPage(1);
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
            Stay updated with lead activities, status changes, applications, and
            reminders.
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
              onClick={() => setDeleteAllOpen(true)}
              disabled={deleteAll.isPending}
              className="gap-2"
            >
              {deleteAll.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete All
            </Button>
          )}
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="flex items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 w-[220px]">
            <TabsTrigger
              value="all"
              className="
        data-[state=active]:bg-primary
        data-[state=active]:text-primary-foreground
        data-[state=active]:shadow-sm
    "
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="
        relative
        data-[state=active]:bg-primary
        data-[state=active]:text-primary-foreground
        data-[state=active]:shadow-sm
    "
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
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
            <h3 className="text-base font-semibold text-foreground">
              No notifications found
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === "unread"
                ? "You have no unread notifications right now."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-1 divide-y divide-border/40">
            {notifications.map((item : any) => (
              <NotificationItem
                key={item.id}
                notification={item}
                showDeleteAction
              />
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4 px-2">
            <p className="text-xs text-muted-foreground">
              Showing page <span className="font-semibold">{meta.page}</span> of{" "}
              <span className="font-semibold">{meta.totalPages}</span> (
              {meta.total} total)
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
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all notifications?</AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all
              notifications from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAll.isPending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={deleteAll.isPending}
              onClick={async (e) => {
                e.preventDefault();

                try {
                  await deleteAll.mutateAsync();

                  setPage(1);

                  toast.success("All notifications deleted successfully.");

                  setDeleteAllOpen(false);
                } catch {
                  toast.error("Failed to delete notifications.");
                }
              }}
            >
              {deleteAll.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
