// app\api\students\[id]\stage\route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import {
  StudentModuleStatus,
  StudentModuleType,
  StudentStage,
} from "@/generated/prisma/enums";
import { handleError, ok } from "@/lib/api-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type KanbanStage =
  | "Inquiry"
  | "Documents"
  | "Applied"
  | "Loan Process"
  | "Visa Process";

const STAGE_ORDER: KanbanStage[] = [
  "Inquiry",
  "Documents",
  "Applied",
  "Loan Process",
  "Visa Process",
];

const STAGE_MODULE_MAP: Record<KanbanStage, StudentModuleType> = {
  Inquiry: StudentModuleType.basic_information,
  Documents: StudentModuleType.documents,
  Applied: StudentModuleType.university_applications,
  "Loan Process": StudentModuleType.loan_process,
  "Visa Process": StudentModuleType.visa_process,
};

const KANBAN_TO_STUDENT_STAGE: Record<KanbanStage, StudentStage> = {
  Inquiry: StudentStage.application_started,
  Documents: StudentStage.application_submitted,
  Applied: StudentStage.offer_received,
  "Loan Process": StudentStage.enrolled,
  "Visa Process": StudentStage.visa_filing,
};

const STUDENT_STAGE_TO_KANBAN: Partial<Record<StudentStage, KanbanStage>> = {
  [StudentStage.application_started]: "Inquiry",
  [StudentStage.application_submitted]: "Documents",
  [StudentStage.offer_received]: "Applied",

  [StudentStage.enrolled]: "Loan Process",

  [StudentStage.deposit_pending]: "Visa Process",
  [StudentStage.deposit_paid]: "Visa Process",
  [StudentStage.cas_pending]: "Visa Process",
  [StudentStage.cas_received]: "Visa Process",
  [StudentStage.visa_filing]: "Visa Process",
  [StudentStage.visa_approved]: "Visa Process",
  [StudentStage.visa_rejected]: "Visa Process",
};

const BACKWARD_ALLOWED_ROLES = new Set(["super admin", "director"]);

function normalizeRoleName(roleName?: string | null): string {
  return roleName?.trim().toLowerCase() ?? "";
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
        {
          status: 400,
        },
      );
    }
    const token = (await cookies()).get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const payload = await verifyToken(token);

    if (!payload?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid authentication token",
        },
        {
          status: 401,
        },
      );
    }

    const currentUser = await db.user.findUnique({
      where: {
        id: payload.id as string,
      },
      select: {
        id: true,
        name: true,

        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authenticated user not found",
        },
        {
          status: 401,
        },
      );
    }

    const currentUserRole = normalizeRoleName(currentUser.role?.name);

    const canMoveBackward = BACKWARD_ALLOWED_ROLES.has(currentUserRole);
    const body = await request.json();

    const nextStage = body.nextStage as KanbanStage;

    if (!nextStage || !STAGE_ORDER.includes(nextStage)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid destination stage",
        },
        {
          status: 400,
        },
      );
    }
    const student = await db.student.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        currentStage: true,

        moduleProgress: {
          select: {
            id: true,
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
        {
          status: 404,
        },
      );
    }
    const currentKanbanStage: KanbanStage = student.currentStage
      ? (STUDENT_STAGE_TO_KANBAN[student.currentStage] ?? "Inquiry")
      : "Inquiry";

    const currentStageIndex = STAGE_ORDER.indexOf(currentKanbanStage);

    const destinationStageIndex = STAGE_ORDER.indexOf(nextStage);

    const stageDifference = destinationStageIndex - currentStageIndex;

    const isForwardMove = stageDifference === 1;

    const isBackwardMove = stageDifference === -1;
    if (!isForwardMove && !isBackwardMove) {
      return NextResponse.json(
        {
          success: false,
          message: "Student can move only one stage at a time",
        },
        {
          status: 400,
        },
      );
    }
    if (isBackwardMove && !canMoveBackward) {
      return NextResponse.json(
        {
          success: false,
          message: "Only Admin and Director can move students backward",
        },
        {
          status: 403,
        },
      );
    }
    if (isForwardMove) {
      const currentModule = STAGE_MODULE_MAP[currentKanbanStage];

      const currentModuleProgress = student.moduleProgress.find(
        (item) => item.module === currentModule,
      );

      if (
        currentModuleProgress?.status !== StudentModuleStatus.completed ||
        currentModuleProgress.progress !== 100
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Current module must be completed with 100% progress before moving forward",
          },
          {
            status: 400,
          },
        );
      }
    }
    const currentModule = STAGE_MODULE_MAP[currentKanbanStage];

    const nextModule = STAGE_MODULE_MAP[nextStage];

    const prismaNextStage = KANBAN_TO_STUDENT_STAGE[nextStage];

    const result = await db.$transaction(async (tx) => {
      const updatedStudent = await tx.student.update({
        where: {
          id,
        },

        data: {
          currentStage: prismaNextStage,
        },

        select: {
          id: true,
          currentStage: true,
        },
      });
      if (isForwardMove) {
        await tx.studentModuleProgress.upsert({
          where: {
            studentId_module: {
              studentId: id,
              module: nextModule,
            },
          },

          update: {
            status: StudentModuleStatus.not_started,
            progress: 0,
          },

          create: {
            studentId: id,
            module: nextModule,
            status: StudentModuleStatus.not_started,
            progress: 0,
          },
        });
      }
      if (isBackwardMove) {
        await tx.studentModuleProgress.upsert({
          where: {
            studentId_module: {
              studentId: id,
              module: currentModule,
            },
          },

          update: {
            status: StudentModuleStatus.not_started,
            progress: 0,
          },

          create: {
            studentId: id,
            module: currentModule,
            status: StudentModuleStatus.not_started,
            progress: 0,
          },
        });
      }

      return updatedStudent;
    });

    return ok(
      result,
      isBackwardMove
        ? "Student moved backward successfully"
        : "Student moved forward successfully",
    );
  } catch (error) {
    console.error("PATCH_STUDENT_STAGE_ERROR", error);

    return handleError(error);
  }
}
