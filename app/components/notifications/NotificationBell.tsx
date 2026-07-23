"use client";

import { useState } from "react";

import Link from "next/link";

import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Skeleton } from "@/components/ui/skeleton";

import { useUnreadCount } from "@/hooks/notifications/useUnreadCount";

import { useNotifications } from "@/hooks/notifications/useNotifications";

import { useMarkAllRead } from "@/hooks/notifications/useMarkAllRead";

import { useNotificationSocket } from "@/hooks/notifications/useNotificationSocket";

import { NotificationItem } from "./NotificationItem";

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  useNotificationSocket();

  const { data: unreadData } = useUnreadCount();

  const unreadCount = unreadData?.count ?? 0;

  const {
    data: notificationsData,
    isLoading,
    isFetching,
  } = useNotifications({
    limit: 10,
    filter: "all",
  });

  const markAllRead = useMarkAllRead();

  const notifications = notificationsData?.data ?? [];

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);

    if (isOpen) {
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
        refetchType: "active",
      });
    }
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueriesData(
          {
            predicate: (query) =>
              query.queryKey[0] === "notifications" &&
              query.queryKey.includes("unread-count"),
          },
          (oldData: unknown) => {
            if (!oldData || typeof oldData !== "object") {
              return {
                count: 0,
              };
            }

            return {
              ...oldData,
              count: 0,
            };
          },
        );

        void queryClient.invalidateQueries({
          queryKey: ["notifications"],
          refetchType: "active",
        });
      },
    });
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative rounded-full"
          aria-label={`Notifications${
            unreadCount > 0 ? `, ${unreadCount} unread` : ""
          }`}
        >
          <Bell className="size-4" />

          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 border border-border p-0 shadow-lg sm:w-96"
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              Notifications
            </h4>

            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {unreadCount} unread
              </span>
            )}

            {isFetching && !isLoading && (
              <Loader2 className="size-3 animate-spin text-muted-foreground" />
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              {markAllRead.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5 text-blue-500" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-85">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-full" />

                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Inbox className="mb-2 size-8 stroke-1 text-muted-foreground/60" />

              <p className="text-xs font-medium">No notifications yet</p>

              <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClosePopover={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border bg-muted/20 p-2 text-center">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="inline-block py-1 text-xs font-medium text-primary hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
