import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { getCurrentIstDate, getIstMonthRange } from "@/lib/performance-period";
import {
  buildCounsellorPerformanceReport,
  PerformanceAccessError,
} from "@/services/performance/counsellor-performance.server";
import { createCounsellorPerformanceWorkbook } from "@/services/performance/counsellor-performance-excel.server";
import type {
  PerformancePeriodType,
  PerformanceSortField,
  SortOrder,
} from "@/types/counsellor-performance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpdateMonthlyTargetBody = {
  counsellorId?: string;
  year?: number;
  month?: number;
  target?: number;
};

const COUNSELLOR_ROLE_NAMES = ["Counsellor", "Counselor"];
const PERIOD_TYPES = new Set<PerformancePeriodType>([
  "daily",
  "weekly",
  "monthly",
]);
const SORT_FIELDS = new Set<PerformanceSortField>([
  "name",
  "target",
  "achieved",
  "leadsCreated",
  "completionPercentage",
]);
const SORT_ORDERS = new Set<SortOrder>(["asc", "desc"]);

function normalizeRoleName(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

function getAssignedBranchIds(
  branches:
    | Array<{
        id?: string | null;
      }>
    | null
    | undefined,
) {
  return Array.from(
    new Set(
      (branches ?? [])
        .map((branch) => branch.id?.trim())
        .filter((branchId): branchId is string => Boolean(branchId)),
    ),
  );
}

function forbidden(message: string) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    {
      status: 403,
    },
  );
}

function parsePeriod(value: string | null): PerformancePeriodType {
  return PERIOD_TYPES.has(value as PerformancePeriodType)
    ? (value as PerformancePeriodType)
    : "monthly";
}

function parseSortField(value: string | null): PerformanceSortField {
  return SORT_FIELDS.has(value as PerformanceSortField)
    ? (value as PerformanceSortField)
    : "completionPercentage";
}

function parseSortOrder(value: string | null): SortOrder {
  return SORT_ORDERS.has(value as SortOrder) ? (value as SortOrder) : "desc";
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.ASSIGN_TARGET,
      PERMISSIONS.READ,
    );

    const searchParams = req.nextUrl.searchParams;
    const report = await buildCounsellorPerformanceReport(currentUser, {
      period: parsePeriod(searchParams.get("period")),
      date: searchParams.get("date")?.trim() || getCurrentIstDate(),
      branchId: searchParams.get("branchId")?.trim() || undefined,
      search: searchParams.get("search")?.trim() || undefined,
      sortBy: parseSortField(searchParams.get("sortBy")),
      sortOrder: parseSortOrder(searchParams.get("sortOrder")),
    });

    if (searchParams.get("format") === "xlsx") {
      const workbook = await createCounsellorPerformanceWorkbook(report);
      const filename = `counsellor-performance-${report.period.type}-${report.period.date}.xlsx`;

      return new Response(Buffer.from(workbook), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return ok(report);
  } catch (error) {
    if (error instanceof PerformanceAccessError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          data: null,
        },
        {
          status: error.status,
        },
      );
    }

    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.ASSIGN_TARGET,
      PERMISSIONS.UPDATE,
    );

    const body = (await req
      .json()
      .catch(() => null)) as UpdateMonthlyTargetBody | null;

    const counsellorId =
      typeof body?.counsellorId === "string" ? body.counsellorId.trim() : "";
    const year = Number(body?.year);
    const month = Number(body?.month);
    const target = Number(body?.target);

    if (!counsellorId) {
      throw new Error("Counsellor ID is required");
    }

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new Error("Invalid year");
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error("Invalid month");
    }

    if (!Number.isInteger(target) || target < 0) {
      throw new Error("Target must be a non-negative integer");
    }

    const roleName = normalizeRoleName(currentUser.role?.name);
    const isCounsellor = roleName === "counsellor" || roleName === "counselor";
    const isBranchManager = roleName === "branch manager";
    const assignedBranchIds = getAssignedBranchIds(currentUser.branches);

    if (isCounsellor && counsellorId !== currentUser.id) {
      return forbidden("You can only access your own target");
    }

    if (isBranchManager && assignedBranchIds.length === 0) {
      return forbidden("No branches are assigned to your account");
    }

    const { periodStart } = getIstMonthRange(year, month);

    const counsellorWhere: Prisma.UserWhereInput = {
      id: counsellorId,
      role: {
        name: {
          in: COUNSELLOR_ROLE_NAMES,
          mode: "insensitive",
        },
      },
      ...(isBranchManager
        ? {
            branches: {
              some: {
                id: {
                  in: assignedBranchIds,
                },
              },
            },
          }
        : {}),
    };

    const counsellor = await db.user.findFirst({
      where: counsellorWhere,
      select: {
        id: true,
        name: true,
      },
    });

    if (!counsellor) {
      return forbidden(
        "Counsellor not found or you do not have access to this counsellor",
      );
    }

    const monthlyTarget = await db.counsellorMonthlyTarget.upsert({
      where: {
        counsellorId_periodStart: {
          counsellorId: counsellor.id,
          periodStart,
        },
      },
      update: {
        target,
      },
      create: {
        counsellorId: counsellor.id,
        periodStart,
        target,
      },
      select: {
        id: true,
        counsellorId: true,
        periodStart: true,
        target: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok({
      ...monthlyTarget,
      counsellorName: counsellor.name,
    });
  } catch (error) {
    return handleError(error);
  }
}
