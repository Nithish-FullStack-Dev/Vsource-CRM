// app\api\students\[id]\module-progress\route.ts
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
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const destinationModule = body.module as StudentModuleType;

    if (!allowedModules.includes(destinationModule)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid destination module",
        },
        { status: 400 },
      );
    }

    const moduleOrder: StudentModuleType[] = [
      StudentModuleType.basic_information,
      StudentModuleType.documents,
      StudentModuleType.university_applications,
      StudentModuleType.visa_process,
      StudentModuleType.loan_process,
    ];

    const student = await prisma.student.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        moduleProgress: {
          select: {
            module: true,
            status: true,
            progress: true,
          },
        },
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

    const progressMap = new Map(
      student.moduleProgress.map((record) => [record.module, record]),
    );

    let currentModule: StudentModuleType | null = null;

    for (const module of moduleOrder) {
      const progress = progressMap.get(module);

      if (
        progress?.status !== StudentModuleStatus.completed ||
        progress.progress !== 100
      ) {
        currentModule = module;
        break;
      }
    }

    /*
     * All modules are completed.
     * Student cannot move any further.
     */
    if (!currentModule) {
      return NextResponse.json(
        {
          success: false,
          message: "Student has already completed all tracker stages",
        },
        { status: 400 },
      );
    }

    const currentModuleIndex = moduleOrder.indexOf(currentModule);

    /*
     * Loan Process is final stage.
     */
    if (currentModuleIndex === moduleOrder.length - 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Loan Process is the final tracker stage",
        },
        { status: 400 },
      );
    }

    const currentProgress = progressMap.get(currentModule);

    /*
     * Current card must be green:
     *
     * completed + 100%
     */
    if (
      currentProgress?.status !== StudentModuleStatus.completed ||
      currentProgress.progress !== 100
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current module must be completed with 100% progress before moving forward",
        },
        { status: 400 },
      );
    }

    const expectedDestinationModule = moduleOrder[currentModuleIndex + 1];

    /*
     * Only exactly one step forward.
     */
    if (destinationModule !== expectedDestinationModule) {
      return NextResponse.json(
        {
          success: false,
          message: `Student can only move to ${expectedDestinationModule}`,
        },
        { status: 400 },
      );
    }

    const existingDestinationProgress = progressMap.get(destinationModule);

    /*
     * Prevent overwriting an already active/completed destination.
     */
    if (
      existingDestinationProgress &&
      existingDestinationProgress.status !== StudentModuleStatus.not_started
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Destination module has already been started",
        },
        { status: 409 },
      );
    }

    const data = await prisma.$transaction(async (tx) => {
      const destinationProgress = await tx.studentModuleProgress.upsert({
        where: {
          studentId_module: {
            studentId: id,
            module: destinationModule,
          },
        },
        update: {
          status: StudentModuleStatus.started,
          progress: 20,
        },
        create: {
          studentId: id,
          module: destinationModule,
          status: StudentModuleStatus.started,
          progress: 20,
        },
      });

      await tx.studentTimeline.create({
        data: {
          studentId: id,
          type: "status_change",
          title: "Master Tracker Stage Changed",
          description: `Student moved from ${currentModule} to ${destinationModule}`,
          oldValue: currentModule,
          newValue: destinationModule,
        },
      });

      return destinationProgress;
    });

    return ok(data, "Student moved to next stage successfully");
  } catch (error) {
    console.error("PATCH_MODULE_PROGRESS_ERROR", error);

    return handleError(error);
  }
}
