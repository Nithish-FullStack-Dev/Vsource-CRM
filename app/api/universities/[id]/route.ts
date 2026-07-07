/**
 * app/api/universities/[id]/route.ts
 */

import { NextRequest } from "next/server";

import db from "@/lib/prisma";
import { handleError, noContent, notFound, ok } from "@/lib/api-helpers";
import { UniversityUpdateSchema } from "@/lib/schemas";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const university = await db.university.findUnique({
      where: {
        id,
      },
      include: {
        country: true,
        courses: {
          include: {
            intake: true,
          },
          orderBy: {
            name: "asc",
          },
        },
        scholarships: {
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!university) {
      return notFound("University");
    }

    return ok(university);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const body = UniversityUpdateSchema.parse(await req.json());

    const { courses, scholarships, ...universityData } = body;

    const university = await db.$transaction(async (tx) => {
      const existingUniversity = await tx.university.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

      if (!existingUniversity) {
        throw new Error("UNIVERSITY_NOT_FOUND");
      }
      await tx.university.update({
        where: {
          id,
        },
        data: universityData,
      });

      if (courses !== undefined) {
        const existingCourses = await tx.universityCourse.findMany({
          where: {
            universityId: id,
          },
          select: {
            id: true,
            name: true,
          },
        });

        const incomingCourseNames = new Set(
          courses.map((course) => course.name.trim()),
        );

        const removedCourses = existingCourses.filter(
          (existingCourse) =>
            !incomingCourseNames.has(existingCourse.name.trim()),
        );

        const removedCourseIds = removedCourses.map((course) => course.id);

        if (removedCourseIds.length > 0) {
          const usedApplications = await tx.studentApplication.findMany({
            where: {
              courseId: {
                in: removedCourseIds,
              },
            },
            select: {
              courseId: true,
            },
          });

          const usedCourseIds = new Set(
            usedApplications.map((application) => application.courseId),
          );

          const safeCourseIdsToDelete = removedCourseIds.filter(
            (courseId) => !usedCourseIds.has(courseId),
          );

          if (safeCourseIdsToDelete.length > 0) {
            await tx.universityCourse.deleteMany({
              where: {
                universityId: id,
                id: {
                  in: safeCourseIdsToDelete,
                },
              },
            });
          }
        }
        for (const course of courses) {
          const existingCourse = existingCourses.find(
            (item) =>
              item.name.trim().toLowerCase() ===
              course.name.trim().toLowerCase(),
          );

          if (existingCourse) {
            await tx.universityCourse.update({
              where: {
                id: existingCourse.id,
              },
              data: {
                ...course,
                name: course.name.trim(),
              },
            });
          } else {
            await tx.universityCourse.create({
              data: {
                ...course,
                name: course.name.trim(),
                universityId: id,
              },
            });
          }
        }
      }
      if (scholarships !== undefined) {
        await tx.universityScholarship.deleteMany({
          where: {
            universityId: id,
          },
        });
        for (const scholarship of scholarships) {
          await tx.universityScholarship.create({
            data: {
              ...scholarship,
              universityId: id,
            },
          });
        }
      }
      return tx.university.findUnique({
        where: {
          id,
        },
        include: {
          country: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          courses: {
            include: {
              intake: true,
            },
            orderBy: {
              name: "asc",
            },
          },
          scholarships: {
            orderBy: {
              name: "asc",
            },
          },
        },
      });
    });

    return ok(university, "University updated successfully");
  } catch (err) {
    if (err instanceof Error && err.message === "UNIVERSITY_NOT_FOUND") {
      return notFound("University");
    }

    return handleError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;

    const university = await db.university.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!university) {
      return notFound("University");
    }

    await db.university.delete({
      where: {
        id,
      },
    });

    return noContent();
  } catch (err) {
    return handleError(err);
  }
}
