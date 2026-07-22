"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useUnreadCount } from "@/hooks/notifications/useUnreadCount";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { useMarkAllRead } from "@/hooks/notifications/useMarkAllRead";
import { NotificationItem } from "./NotificationItem";

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const { data: notificationsData, isLoading } = useNotifications({
    limit: 10,
    filter: "all",
  });

  const markAllRead = useMarkAllRead();

  const notifications = notificationsData?.data ?? [];

  const queryClient = useQueryClient();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative rounded-full"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-96 p-0 shadow-lg border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => markAllRead.mutate()}
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

        {/* List content */}
        <ScrollArea className="h-[340px]">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Inbox className="size-8 stroke-1 text-muted-foreground/60 mb-2" />
              <p className="text-xs font-medium">No notifications yet</p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((item) => (
                <NotificationItem
                  key={item.id}
                  notification={item}
                  onClosePopover={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t border-border bg-muted/20 text-center">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="inline-block text-xs font-medium text-primary hover:underline py-1"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
