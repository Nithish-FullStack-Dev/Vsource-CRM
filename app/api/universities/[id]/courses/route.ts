/**
 * api/universities/[id]/courses/route.ts
 * GET  /api/universities/:id/courses  — list courses for a university
 * POST /api/universities/:id/courses  — add a course
 */

import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import {
  ok,
  created,
  notFound,
  handleError,
  parsePagination,
  buildMeta,
} from "@/lib/api-helpers";
import { UniversityCourseCreateSchema } from "@/lib/schemas";
import { DegreeType } from "@/generated/prisma/enums";
// import type { DegreeType } from "@/generated/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: universityId } = await params;
    const sp = req.nextUrl.searchParams;
    const { skip, take, page, limit } = parsePagination(sp);

    const university = await db.university.findUnique({
      where: { id: universityId },
    });
    if (!university) return notFound("University");

    const degree = sp.get("degree") as DegreeType | null;
    const intakeId = sp.get("intakeId") ?? undefined;
    const status =
      sp.get("status") !== null ? sp.get("status") === "true" : undefined;

    const where = {
      universityId,
      ...(degree && { degree }),
      ...(intakeId && { intakeId }),
      ...(status !== undefined && { status }),
    };

    const [courses, total] = await Promise.all([
      db.universityCourse.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        include: {
          intake: { select: { id: true, name: true } },
          _count: { select: { scholarships: true } },
        },
      }),
      db.universityCourse.count({ where }),
    ]);

    return ok(courses, undefined, buildMeta(total, page, limit));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: universityId } = await params;

    const university = await db.university.findUnique({
      where: { id: universityId },
    });

    if (!university) {
      return notFound("University");
    }

    const body = UniversityCourseCreateSchema.parse(await req.json());

    const existingCourse = await db.universityCourse.findFirst({
      where: {
        universityId,
        name: {
          equals: body.name.trim(),
          mode: "insensitive",
        },
      },
    });

    if (existingCourse) {
      return Response.json(
        {
          success: false,
          message: "Course already exists for this university.",
        },
        {
          status: 400,
        },
      );
    }

    const course = await db.universityCourse.create({
      data: {
        ...body,
        name: body.name.trim(),
        universityId,
      },
      include: {
        intake: true,
      },
    });

    return created(course, "Course created successfully");
  } catch (err) {
    return handleError(err);
  }
}
