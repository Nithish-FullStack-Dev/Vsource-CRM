/**
 * app/api/notifications/mark-all-read/route.ts
 * PATCH /api/notifications/mark-all-read
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { verifyToken } from "@/lib/jwt";
import { ApiError } from "@/lib/rbac";

export async function PATCH(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;
    if (!token) throw new ApiError(401, "Unauthorized");
    const payload = await verifyToken(token);
    if (!payload?.id) throw new ApiError(401, "Unauthorized");
    const userId = payload.id as string;

    const now = new Date();

    const result = await db.notification.updateMany({
      where: {
        recipientId: userId,
        readAt: null,
        archivedAt: null,
      },
      data: {
        readAt: now,
        updatedAt: now,
      },
    });

    return ok({ updated: result.count }, "All notifications marked as read");
  } catch (err) {
    return handleError(err);
  }
}
