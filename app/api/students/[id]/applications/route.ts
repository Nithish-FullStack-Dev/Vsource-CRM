//app\api\students\[id]\applications\route.ts

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";
import { ApplicationStatus, OfferStatus } from "@/generated/prisma/enums";
import { notifyApplicationEvent } from "@/lib/notification.service";
import { MODULES, PERMISSIONS } from "@/lib/module-codes";
import { getAuthorizedUser } from "@/lib/rbac";
import { triggerNotificationProcessor } from "@/lib/socket/trigger-processor";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getAuthorizedUser(
      req,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.UPDATE,
    );

    const { id: studentId } = await params;

    const body = await req.json();

    const accessToken = req.cookies.get("access_token")?.value;

    if (!body.countryId) {
      throw new Error("Country is required");
    }

    if (!body.universityId) {
      throw new Error("University is required");
    }

    if (!body.courseId) {
      throw new Error("Course is required");
    }

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

    if (body.intakeId && course.intakeId !== body.intakeId) {
      throw new Error("Selected intake does not belong to selected course");
    }

    const country = await prisma.country.findUnique({
      where: {
        id: body.countryId,
      },
      select: {
        name: true,
      },
    });
    const applicationCount = await prisma.studentApplication.count({
      where: {
        studentId,
      },
    });

    if (applicationCount >= 5) {
      throw new Error("Maximum 5 university applications allowed per student");
    }

    const application = await prisma.$transaction(async (tx) => {
      const createdApplication = await tx.studentApplication.create({
        data: {
          studentId,

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
        createdApplication.offerStatus &&
        createdApplication.offerStatus !== "PENDING"
      ) {
        await notifyApplicationEvent(
          {
            id: createdApplication.student.id,
            studentName: createdApplication.student.studentName,
            branchId: createdApplication.student.branchId,
            counselorId: createdApplication.student.counselorId,
          },
          createdApplication.id,
          createdApplication.offerStatus,
          currentUser.id,
          tx,
        );
      }

      return createdApplication;
    });

    await triggerNotificationProcessor(accessToken);

    return ok(application, "Application created successfully");
  } catch (error) {
    return handleError(error);
  }
}
