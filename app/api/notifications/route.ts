/**
 * app/api/notifications/route.ts
 * GET /api/notifications — paginated list for the current user
 * DELETE /api/notifications — delete all notifications for the current user
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError, parsePagination, buildMeta } from "@/lib/api-helpers";
import { verifyToken } from "@/lib/jwt";
import { ApiError } from "@/lib/rbac";

async function getCurrentUserId(req: NextRequest): Promise<string> {
  const token = req.cookies.get("access_token")?.value;
  if (!token) throw new ApiError(401, "Unauthorized");
  const payload = await verifyToken(token);
  if (!payload?.id) throw new ApiError(401, "Unauthorized");
  return payload.id as string;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);
    const filter = sp.get("filter");

    const where = {
      recipientId: userId,
      archivedAt: null,
      ...(filter === "unread" && {
        readAt: null,
      }),
    };

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          eventKey: true,
          entityType: true,
          entityId: true,
          title: true,
          message: true,
          actionUrl: true,
          icon: true,
          priority: true,
          metadata: true,
          readAt: true,
          archivedAt: true,
          createdAt: true,
          User_Notification_actorIdToUser: {
            select: { id: true, name: true },
          },
        },
      }),
      db.notification.count({ where }),
    ]);

    // Flatten actor for cleaner response
    const data = notifications.map((n) => {
      const { User_Notification_actorIdToUser, ...rest } = n;
      return {
        ...rest,
        actor: User_Notification_actorIdToUser,
      };
    });

    return ok(data, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);

    await db.notification.deleteMany({
      where: {
        recipientId: userId,
      },
    });

    return ok(null, "All notifications deleted successfully");
  } catch (err) {
    return handleError(err);
  }
}
