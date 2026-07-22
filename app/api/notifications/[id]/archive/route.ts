/**
 * app/api/notifications/[id]/archive/route.ts
 * PATCH /api/notifications/:id/archive — archive a notification
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, notFound, handleError } from "@/lib/api-helpers";
import { verifyToken } from "@/lib/jwt";
import { ApiError } from "@/lib/rbac";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const token = req.cookies.get("access_token")?.value;
    if (!token) throw new ApiError(401, "Unauthorized");
    const payload = await verifyToken(token);
    if (!payload?.id) throw new ApiError(401, "Unauthorized");
    const userId = payload.id as string;

    const { id } = await params;
    const now = new Date();

    const existing = await db.notification.findFirst({
      where: { id, recipientId: userId },
      select: { id: true },
    });

    if (!existing) return notFound("Notification");

    const updated = await db.notification.update({
      where: { id },
      data: {
        archivedAt: now,
        readAt: now, // also mark as read when archiving
        updatedAt: now,
      },
      select: {
        id: true,
        archivedAt: true,
        updatedAt: true,
      },
    });

    return ok(updated, "Notification archived");
  } catch (err) {
    return handleError(err);
  }
}
