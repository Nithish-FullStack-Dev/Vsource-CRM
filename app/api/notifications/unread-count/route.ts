/**
 * app/api/notifications/unread-count/route.ts
 * GET /api/notifications/unread-count
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { verifyToken } from "@/lib/jwt";
import { ApiError } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("access_token")?.value;
    if (!token) throw new ApiError(401, "Unauthorized");
    const payload = await verifyToken(token);
    if (!payload?.id) throw new ApiError(401, "Unauthorized");
    const userId = payload.id as string;

    const count = await db.notification.count({
      where: {
        recipientId: userId,
        readAt: null,
        archivedAt: null,
      },
    });

    return ok({ count });
  } catch (err) {
    return handleError(err);
  }
}
