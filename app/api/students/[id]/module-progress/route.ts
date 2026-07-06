import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  StudentModuleStatus,
  StudentModuleType,
} from "@/generated/prisma/enums";
import { handleError, ok } from "@/lib/api-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedModules = Object.values(StudentModuleType);
const allowedStatuses = Object.values(StudentModuleStatus);

const defaultProgress: Record<StudentModuleStatus, number> = {
  not_started: 0,
  started: 20,
  in_progress: 50,
  need_corrections: 75,
  completed: 100,
  rejected: 0,
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Student ID is required",
        },
        { status: 400 },
      );
    }

    const student = await prisma.student.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        { status: 404 },
      );
    }

    const records = await prisma.studentModuleProgress.findMany({
      where: {
        studentId: id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const recordMap = new Map(records.map((record) => [record.module, record]));

    const data = allowedModules.map((module) => {
      const record = recordMap.get(module);

      return {
        id: record?.id ?? null,
        studentId: id,
        module,
        status: record?.status ?? StudentModuleStatus.not_started,
        progress: record?.progress ?? 0,
        createdAt: record?.createdAt ?? null,
        updatedAt: record?.updatedAt ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_MODULE_PROGRESS_ERROR", error);

    return handleError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Student ID is required",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const module = body.module as StudentModuleType;
    const status = body.status as StudentModuleStatus;

    if (!allowedModules.includes(module)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid module",
        },
        { status: 400 },
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status",
        },
        { status: 400 },
      );
    }

    const suppliedProgress =
      body.progress === undefined ||
      body.progress === null ||
      body.progress === ""
        ? null
        : Number(body.progress);

    if (
      suppliedProgress !== null &&
      (!Number.isInteger(suppliedProgress) ||
        suppliedProgress < 0 ||
        suppliedProgress > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Progress must be an integer between 0 and 100",
        },
        { status: 400 },
      );
    }

    const progress = suppliedProgress ?? defaultProgress[status];

    const student = await prisma.student.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        { status: 404 },
      );
    }

    const data = await prisma.studentModuleProgress.upsert({
      where: {
        studentId_module: {
          studentId: id,
          module,
        },
      },
      update: {
        status,
        progress,
      },
      create: {
        studentId: id,
        module,
        status,
        progress,
      },
    });

    return ok(data, "Module progress updated successfully");
  } catch (error) {
    console.error("PUT_MODULE_PROGRESS_ERROR", error);

    return handleError(error);
  }
}
