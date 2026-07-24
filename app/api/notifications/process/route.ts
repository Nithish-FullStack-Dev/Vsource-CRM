/**
 * app/api/notifications/process/route.ts
 * POST /api/notifications/process
 */

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { verifyToken } from "@/lib/jwt";
import {
  emitNotificationToUser,
  emitUnreadCountToUser,
} from "@/lib/socket/notification-emitter";
import type { NotificationSocketPayload } from "@/lib/socket/event";

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

interface OutboxPayload {
  eventId?: string;
  recipientId: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  metadata?: Record<string, unknown>;
}

function getAccessToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get("access_token")?.value;

  if (cookieToken) {
    return cookieToken;
  }

  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  return null;
}

async function authenticateRequest(
  request: NextRequest,
): Promise<string | null> {
  const token = getAccessToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);

    if (!payload || typeof payload.id !== "string" || !payload.id) {
      return null;
    }

    return payload.id;
  } catch {
    return null;
  }
}

function parseOutboxPayload(value: Prisma.JsonValue): OutboxPayload {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid notification outbox payload");
  }

  const payload = value as Record<string, unknown>;

  if (typeof payload.recipientId !== "string" || !payload.recipientId) {
    throw new Error("Missing recipientId in notification outbox payload");
  }

  if (typeof payload.title !== "string" || !payload.title) {
    throw new Error("Missing title in notification outbox payload");
  }

  if (typeof payload.message !== "string" || !payload.message) {
    throw new Error("Missing message in notification outbox payload");
  }

  let priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" = "NORMAL";

  if (
    payload.priority === "LOW" ||
    payload.priority === "NORMAL" ||
    payload.priority === "HIGH" ||
    payload.priority === "URGENT"
  ) {
    priority = payload.priority;
  }

  return {
    eventId: typeof payload.eventId === "string" ? payload.eventId : undefined,

    recipientId: payload.recipientId,

    title: payload.title,

    message: payload.message,

    actionUrl: typeof payload.actionUrl === "string" ? payload.actionUrl : null,

    priority,

    metadata:
      typeof payload.metadata === "object" &&
      payload.metadata !== null &&
      !Array.isArray(payload.metadata)
        ? (payload.metadata as Record<string, unknown>)
        : {},
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authenticatedUserId = await authenticateRequest(request);

  if (!authenticatedUserId) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  const processorId = randomUUID();
  const claimedAt = new Date();

  try {
    const candidates = await db.notificationOutbox.findMany({
      where: {
        status: "PENDING",
        nextAttemptAt: {
          lte: claimedAt,
        },
      },
      take: BATCH_SIZE,
      orderBy: {
        createdAt: "asc",
      },
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        failed: 0,
      });
    }

    await db.notificationOutbox.updateMany({
      where: {
        id: {
          in: candidates.map((item) => item.id),
        },
        status: "PENDING",
      },
      data: {
        status: "PROCESSING",
        lockedAt: claimedAt,
        lockedBy: processorId,
        updatedAt: claimedAt,
      },
    });

    const claimed = await db.notificationOutbox.findMany({
      where: {
        lockedBy: processorId,
        status: "PROCESSING",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    let processed = 0;
    let failed = 0;

    for (const outbox of claimed) {
      try {
        const payload = parseOutboxPayload(outbox.payload);

        const eventId = payload.eventId ?? outbox.id;

        const processedAt = new Date();

        const result = await db.$transaction(async (tx) => {
          let notification = await tx.notification.findFirst({
            where: {
              eventId,
              recipientId: payload.recipientId,
            },
            include: {
              User_Notification_actorIdToUser: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          if (!notification) {
            notification = await tx.notification.create({
              data: {
                id: randomUUID(),

                eventId,
                eventKey: outbox.eventKey,

                recipientId: payload.recipientId,

                actorId: outbox.actorId ?? null,

                branchId: outbox.branchId ?? null,

                entityType: outbox.aggregateType,

                entityId: outbox.aggregateId,

                title: payload.title,

                message: payload.message,

                actionUrl: payload.actionUrl ?? null,

                icon: null,

                priority: payload.priority ?? "NORMAL",

                metadata: payload.metadata as Prisma.InputJsonValue,

                readAt: null,
                archivedAt: null,

                createdAt: processedAt,

                updatedAt: processedAt,
              },
              include: {
                User_Notification_actorIdToUser: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            });
          }

          await tx.notificationOutbox.update({
            where: {
              id: outbox.id,
            },
            data: {
              status: "PROCESSED",

              processedAt,

              lockedAt: null,
              lockedBy: null,

              lastError: null,

              updatedAt: processedAt,
            },
          });

          const unreadCount = await tx.notification.count({
            where: {
              recipientId: payload.recipientId,

              readAt: null,
              archivedAt: null,
            },
          });

          return {
            notification,
            unreadCount,
          };
        });

        const { User_Notification_actorIdToUser: actor, ...notification } =
          result.notification;

        const socketPayload: NotificationSocketPayload = {
          id: notification.id,

          eventId: notification.eventId,

          eventKey: notification.eventKey,

          entityType: notification.entityType ?? "",

          entityId: notification.entityId ?? "",

          title: notification.title,

          message: notification.message,

          actionUrl: notification.actionUrl,

          icon: notification.icon,

          priority: notification.priority,

          metadata:
            notification.metadata &&
            typeof notification.metadata === "object" &&
            !Array.isArray(notification.metadata)
              ? (notification.metadata as Record<string, unknown>)
              : null,

          readAt: notification.readAt?.toISOString() ?? null,

          archivedAt: notification.archivedAt?.toISOString() ?? null,

          createdAt: notification.createdAt.toISOString(),

          actor,
        };

        await Promise.allSettled([
          emitNotificationToUser(payload.recipientId, socketPayload),

          emitUnreadCountToUser(payload.recipientId, result.unreadCount),
        ]);

        processed += 1;
      } catch (error) {
        failed += 1;

        const attempts = outbox.attempts + 1;

        const backoffMinutes = Math.min(2 ** attempts, 60);

        const nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

        console.error(`[NotificationProcessor] Failed ${outbox.id}`, error);

        await db.notificationOutbox.update({
          where: {
            id: outbox.id,
          },
          data: {
            status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",

            attempts,

            nextAttemptAt,

            lastError: error instanceof Error ? error.message : String(error),

            lockedAt: null,
            lockedBy: null,

            updatedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      failed,
    });
  } catch (error) {
    console.error("[NotificationProcessor] Fatal error", error);

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
