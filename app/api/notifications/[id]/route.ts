// app\api\notifications\[id]\route.ts

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { verifyToken } from "@/lib/jwt";
import { ApiError } from "@/lib/rbac";

async function getCurrentUserId(req: NextRequest): Promise<string> {
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  const payload = await verifyToken(token);

  if (!payload?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  return payload.id as string;
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getCurrentUserId(req);
    const { id } = await params;

    const notification = await db.notification.findFirst({
      where: {
        id,
        recipientId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    await db.notification.delete({
      where: {
        id,
      },
    });

    return ok(null, "Notification deleted successfully");
  } catch (err) {
    return handleError(err);
  }
}
