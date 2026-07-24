// app\api\students\applications\[applicationId]\route.ts

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { getAuthorizedUser } from "@/lib/rbac";
import { ApplicationStatus, OfferStatus } from "@/generated/prisma/enums";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";
import { notifyApplicationEvent } from "@/lib/notification.service";

const parseApplicationStatus = (
  value: unknown,
): ApplicationStatus | undefined => {
  switch (value) {
    case "on_hold":
    case "applied":
    case "drop":
      return value;
    default:
      return undefined;
  }
};

const parseOfferStatus = (value: unknown): OfferStatus | undefined => {
  switch (value) {
    case "PENDING":
    case "PRIORITY_UCOL":
    case "PRIORITY_COL":
    case "COL":
    case "UCOL":
      return value;
    default:
      return undefined;
  }
};

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      applicationId: string;
    }>;
  },
) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.UPDATE,
    );

    const { applicationId } = await params;

    const body = await req.json();

    const accessToken = req.cookies.get("access_token")?.value;

    const university = await prisma.university.findUnique({
      where: {
        id: body.universityId,
      },
      select: {
        id: true,
        countryId: true,
        name: true,
      },
    });

    if (!university) {
      throw new Error("University not found");
    }

    if (university.countryId !== body.countryId) {
      throw new Error(
        "Selected university does not belong to selected country",
      );
    }

    const course = await prisma.universityCourse.findFirst({
      where: {
        id: body.courseId,
        universityId: body.universityId,
      },
      include: {
        intake: true,
      },
    });

    if (!course) {
      throw new Error("Selected course does not belong to selected university");
    }

    const country = await prisma.country.findUnique({
      where: {
        id: body.countryId,
      },
      select: {
        name: true,
      },
    });

    const application = await prisma.$transaction(async (tx) => {
      const existingApplication = await tx.studentApplication.findUnique({
        where: {
          id: applicationId,
        },
        select: {
          offerStatus: true,
        },
      });

      const updatedApplication = await tx.studentApplication.update({
        where: {
          id: applicationId,
        },

        data: {
          countryId: body.countryId,
          universityId: body.universityId,
          courseId: body.courseId,
          intakeId: body.intakeId || null,

          portal: body.portal || null,

          applicationDate: body.applicationDate
            ? new Date(body.applicationDate)
            : null,

          followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,

          status: parseApplicationStatus(body.status),
          offerStatus: parseOfferStatus(body.offerStatus),

          countryName: country?.name,
          universityName: university.name,
          courseName: course.name,
          intakeName: course.intake?.name || null,
        },

        include: {
          student: {
            select: {
              id: true,
              studentName: true,
              branchId: true,
              counselorId: true,
            },
          },
          country: true,
          university: true,
          course: true,
          intake: true,
        },
      });

      if (
        updatedApplication.offerStatus &&
        updatedApplication.offerStatus !== "PENDING" &&
        updatedApplication.offerStatus !== existingApplication?.offerStatus
      ) {
        await notifyApplicationEvent(
          {
            id: updatedApplication.student.id,
            studentName: updatedApplication.student.studentName,
            branchId: updatedApplication.student.branchId,
            counselorId: updatedApplication.student.counselorId,
          },
          updatedApplication.id,
          updatedApplication.offerStatus,
          currentUser.id,
          tx,
        );
      }

      return updatedApplication;
    });

    await triggerNotificationProcessor(accessToken);

    return ok(application, "Application updated successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      applicationId: string;
    }>;
  },
) {
  try {
    const { applicationId } = await params;

    await prisma.studentApplication.delete({
      where: {
        id: applicationId,
      },
    });

    return ok(null, "Application deleted successfully");
  } catch (error) {
    return handleError(error);
  }
}
