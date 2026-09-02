// app/api/universities/dropdown/route.ts

import { NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { UniversityTier } from "@/generated/prisma/enums";
export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get("studentId");

    if (!studentId) {
      throw new Error("Student ID is required");
    }

    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        lead: {
          select: {
            preferredCountry: true,
          },
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const preferredCountry = student.lead?.preferredCountry;

    const universities = await prisma.university.findMany({
      where: {
        status: "active",

        ...(preferredCountry && {
          country: {
            name:
              typeof preferredCountry === "object"
                ? preferredCountry.name
                : preferredCountry,
          },
        }),
      },

      select: {
        id: true,
        name: true,
        countryId: true,
        tier: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    return ok(universities, "Fetched universities successfully");
  } catch (error) {
    return handleError(error);
  }
}
