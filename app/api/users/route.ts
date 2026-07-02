/**
 * api/users/route.ts
 * GET  /api/users  — list users (paginated, filterable by role/branch/search)
 * POST /api/users  — create a user
 */

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/prisma";
import { getAuthorizedUser } from "@/lib/rbac";
import {
  ok,
  created,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { UserCreateSchema } from "@/lib/schemas";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { id: true, name: true } },
  branches: { select: { id: true, name: true, code: true } },
} as const;

export async function GET(req: NextRequest) {
  try {
    await getAuthorizedUser(req, MODULES.USERS, PERMISSIONS.READ);

    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const search = sp.get("search") ?? undefined;
    const roleId = sp.get("roleId") ?? undefined;
    const branchId = sp.get("branchId") ?? undefined;

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(roleId && { roleId }),
      ...(branchId && { branches: { some: { id: branchId } } }),
    };

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: USER_SELECT,
      }),
      db.user.count({ where }),
    ]);

    return ok(users, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAuthorizedUser(req, MODULES.USERS, PERMISSIONS.CREATE);

    const { branchIds, password, ...rest } = UserCreateSchema.parse(
      await req.json(),
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        ...rest,
        password: hashedPassword,
        ...(branchIds?.length && {
          branches: { connect: branchIds.map((id) => ({ id })) },
        }),
      },
      select: USER_SELECT,
    });

    return created(user, "User created successfully");
  } catch (err) {
    return handleError(err);
  }
}
