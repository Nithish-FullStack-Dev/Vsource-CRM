/**
 * api/roles/route.ts
 * GET  /api/roles  — list all roles
 * POST /api/roles  — create a role
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { RoleCreateSchema } from "@/lib/schemas";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

export async function GET(req: NextRequest) {
  try {
    // await getAuthorizedUser(req, MODULES.ROLES, PERMISSIONS.READ);

    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);
    const search = sp.get("search") ?? undefined;

    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const [roles, total] = await Promise.all([
      db.role.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: {
          modulePermissions: true,
          _count: { select: { users: true, modulePermissions: true } },
        },
      }),
      db.role.count({ where }),
    ]);

    return ok(roles, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // await getAuthorizedUser(req, MODULES.ROLES, PERMISSIONS.CREATE);

    const body = RoleCreateSchema.parse(await req.json());
    const role = await db.role.create({ data: body });
    return created(role, "Role created successfully");
  } catch (err) {
    return handleError(err);
  }
}
