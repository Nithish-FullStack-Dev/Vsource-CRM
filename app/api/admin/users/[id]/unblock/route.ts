import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { getAuthorizedUser, ApiError } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";
import { ok, handleError } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const currentUser = await getAuthorizedUser(
      req,
      MODULES.USERS,
      PERMISSIONS.UPDATE,
    );

    if (currentUser.role.name !== ROLES.SUPER_ADMIN) {
      throw new ApiError(403, "Only Super Admin can unblock users");
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        isBlocked: false,
        failedLoginAttempts: 0,
      },
      select: { id: true, name: true, email: true, isBlocked: true },
    });

    return ok(updated, `${updated.name} has been unblocked`);
  } catch (error) {
    return handleError(error);
  }
}