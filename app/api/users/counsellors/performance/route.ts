import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { getAuthorizedUser } from "@/lib/rbac";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { getCurrentIstDate } from "@/lib/performance-period";
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

type UpdateIntakeTargetBody = {
  counsellorId?: string;
  intakeId?: string;
  target?: number;
};

const COUNSELLOR_ROLE_NAMES = ["Counsellor", "Counselor"];

const PERIOD_TYPES = new Set<PerformancePeriodType>([
  "daily",
  "weekly",
  "monthly",
  "custom",
]);

const SORT_FIELDS = new Set<PerformanceSortField>([
  "name",
  "target",
  "achieved",
  "applicationsCreated",
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

function resolvePerformanceDate(searchParams: URLSearchParams) {
  const explicitDate = searchParams.get("date")?.trim();

  return explicitDate || getCurrentIstDate();
}

function createExportFilename(
  intakeName: string,
  startDate: string,
  endDate: string,
) {
  const safeIntakeName =
    intakeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "no-intake";

  return `counsellor-performance-${safeIntakeName}-${startDate}-to-${endDate}.xlsx`;
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.ASSIGN_TARGET,
      PERMISSIONS.READ,
    );

    const searchParams = req.nextUrl.searchParams;
    const period = parsePeriod(searchParams.get("period"));

    const report = await buildCounsellorPerformanceReport(currentUser, {
      period,
      date: resolvePerformanceDate(searchParams),
      startDate: searchParams.get("startDate")?.trim() || undefined,
      endDate: searchParams.get("endDate")?.trim() || undefined,
      branchId: searchParams.get("branchId")?.trim() || undefined,
      intakeId: searchParams.get("intakeId")?.trim() || undefined,
      search: searchParams.get("search")?.trim() || undefined,
      sortBy: parseSortField(searchParams.get("sortBy")),
      sortOrder: parseSortOrder(searchParams.get("sortOrder")),
    });

    if (searchParams.get("format") === "xlsx") {
      const workbook = await createCounsellorPerformanceWorkbook(report);
      const filename = createExportFilename(
        report.period.intakeName,
        report.period.startDate,
        report.period.endDate,
      );

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
      .catch(() => null)) as UpdateIntakeTargetBody | null;

    const counsellorId =
      typeof body?.counsellorId === "string" ? body.counsellorId.trim() : "";

    const intakeId =
      typeof body?.intakeId === "string" ? body.intakeId.trim() : "";

    const target = Number(body?.target);

    if (!counsellorId) {
      throw new Error("Counsellor ID is required");
    }

    if (!intakeId) {
      throw new Error("Intake is required");
    }

    if (!Number.isInteger(target) || target < 0) {
      throw new Error("Target must be a non-negative integer");
    }

    const roleName = normalizeRoleName(currentUser.role?.name);
    const isCounsellor = roleName === "counsellor" || roleName === "counselor";
    const isBranchManager = roleName === "branch manager";
    const assignedBranchIds = getAssignedBranchIds(currentUser.branches);

    if (isCounsellor && counsellorId !== currentUser.id) {
      return forbidden("You can only update your own target");
    }

    if (isBranchManager && assignedBranchIds.length === 0) {
      return forbidden("No branches are assigned to your account");
    }

    const intake = await db.intake.findFirst({
      where: {
        id: intakeId,
        status: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!intake) {
      throw new Error("Invalid or inactive intake selected");
    }

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

    const intakeTarget = await db.counsellorIntakeTarget.upsert({
      where: {
        counsellorId_intakeId: {
          counsellorId: counsellor.id,
          intakeId: intake.id,
        },
      },
      update: {
        target,
      },
      create: {
        counsellorId: counsellor.id,
        intakeId: intake.id,
        target,
      },
      select: {
        id: true,
        counsellorId: true,
        intakeId: true,
        target: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return ok({
      ...intakeTarget,
      counsellorName: counsellor.name,
      intakeName: intake.name,
    });
  } catch (error) {
    return handleError(error);
  }
}
