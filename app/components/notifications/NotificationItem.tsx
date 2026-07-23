// app\components\notifications\NotificationItem.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Users,
  GraduationCap,
  FileText,
  Landmark,
  Plane,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Bell,
  Sparkles,
  Loader2,
} from "lucide-react";
import { NotificationItem as NotificationItemType } from "@/services/notifications/notification.service";
import { useMarkRead } from "@/hooks/notifications/useMarkRead";
// import { useDeleteNotification } from "@/hooks/notifications/useDeleteNotification";
import { cn } from "@/lib/utils";
import { useDeleteNotification } from "@/hooks/notifications/useDeleteNotification";
// import { useDeleteNotification } from "@/hooks/notifications/useDeleteAllNotifications";
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
interface NotificationItemProps {
  notification: NotificationItemType;
  onClosePopover?: () => void;
  showDeleteAction?: boolean;
}

function getEventIcon(eventKey: string, entityType: string | null) {
  if (eventKey.startsWith("LEAD"))
    return <UserPlus className="size-4 text-blue-500" />;
  if (eventKey.startsWith("STUDENT"))
    return <GraduationCap className="size-4 text-emerald-500" />;
  if (eventKey.startsWith("APPLICATION"))
    return <FileText className="size-4 text-purple-500" />;
  if (eventKey.startsWith("LOAN"))
    return <Landmark className="size-4 text-amber-500" />;
  if (eventKey.startsWith("VISA"))
    return <Plane className="size-4 text-cyan-500" />;
  if (eventKey.startsWith("FOLLOWUP"))
    return <Clock className="size-4 text-rose-500" />;

  switch (entityType) {
    case "lead":
      return <Users className="size-4 text-blue-500" />;
    case "student":
      return <GraduationCap className="size-4 text-emerald-500" />;
    case "application":
      return <FileText className="size-4 text-purple-500" />;
    case "loan":
      return <Landmark className="size-4 text-amber-500" />;
    default:
      return <Bell className="size-4 text-primary" />;
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function NotificationItem({
  notification,
  onClosePopover,
  showDeleteAction = false,
}: NotificationItemProps) {
  const router = useRouter();
  const markRead = useMarkRead();
  const deleteNotification = useDeleteNotification();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isUnread = !notification.readAt;

  const [isDeleting, setIsDeleting] = useState(false);

  const handleClick = () => {
    if (isDeleting) return;

    if (isUnread) {
      markRead.mutate(notification.id);
    }

    onClosePopover?.();

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex items-start gap-3 p-3 text-left transition-colors cursor-pointer rounded-lg border border-transparent hover:bg-accent/60",
        isUnread ? "bg-accent/30 font-medium" : "opacity-85",
      )}
    >
      {/* Module Icon Container */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background shadow-xs border border-border">
        {getEventIcon(notification.eventKey, notification.entityType)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-foreground truncate">
            {notification.title}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
          {notification.message}
        </p>

        {/* Priority Badge if Urgent/High */}
        {notification.priority === "URGENT" ||
        notification.priority === "HIGH" ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
            <AlertCircle className="size-3" /> Priority
          </span>
        ) : null}
      </div>

      {/* Unread indicator / Actions */}
      <div className="flex items-center gap-1.5 shrink-0 self-center">
        {isUnread && (
          <span
            className="size-2 rounded-full bg-blue-600 dark:bg-blue-400"
            title="Unread"
          />
        )}
        {showDeleteAction && (
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();

              setIsDeleting(true);

              try {
                await deleteNotification.mutateAsync(notification.id);
                toast.success("Notification deleted.");
                setDeleteOpen(false);
              } catch {
                toast.error("Unable to delete notification.");
              } finally {
                setIsDeleting(false);
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-red-600 transition-all"
            title="Delete notification"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>

            <AlertDialogDescription>
              This notification will be permanently deleted. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteNotification.isPending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={deleteNotification.isPending}
              onClick={async (e) => {
                e.preventDefault();

                try {
                  await deleteNotification.mutateAsync(notification.id);

                  toast.success("Notification deleted.");

                  setDeleteOpen(false);
                } catch {
                  toast.error("Unable to delete notification.");
                }
              }}
            >
              {deleteNotification.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
