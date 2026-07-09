/**
 * app/api/banks/route.ts
 *
 * GET  /api/banks
 * POST /api/banks
 */

import { NextRequest } from "next/server";

import db from "@/lib/prisma";
import {
  buildMeta,
  created,
  handleError,
  ok,
  parsePagination,
} from "@/lib/api-helpers";
import { BankCreateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const { skip, take, page, limit } = parsePagination(searchParams);

    const status =
      searchParams.get("status") !== null
        ? searchParams.get("status") === "true"
        : undefined;

    const where = {
      ...(status !== undefined && { status }),
    };

    const [banks, total] = await Promise.all([
      db.bank.findMany({
        where,
        skip,
        take,
        orderBy: {
          name: "asc",
        },
      }),

      db.bank.count({
        where,
      }),
    ]);

    return ok(banks, undefined, buildMeta(total, page, limit));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = BankCreateSchema.parse(await req.json());

    const bank = await db.bank.create({
      data: body,
    });

    return created(bank, "Bank created successfully");
  } catch (error) {
    return handleError(error);
  }
}
