import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { PermissionAction } from "./module-codes";
import { ROLES, RoleName } from "@/lib/roles";

export { ROLES };
export type { RoleName };

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getAuthorizedUser(
  req: NextRequest,
  moduleCode: string,
  action: PermissionAction,
) {
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  const payload = await verifyToken(token);

  if (!payload?.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const user = await db.user.findUnique({
    where: {
      id: payload.id as string,
    },
    include: {
      branches: true,
      role: {
        include: {
          modulePermissions: {
            include: {
              module: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.role) {
    throw new ApiError(401, "Unauthorized");
  }

  const permission = user.role.modulePermissions.find(
    (p) => p.module.code === moduleCode,
  );

  if (!permission || !permission[action]) {
    throw new ApiError(
      403,
      `You do not have permission to access ${moduleCode}`,
    );
  }

  return user;
}