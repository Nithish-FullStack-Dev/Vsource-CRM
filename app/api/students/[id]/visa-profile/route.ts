import { NextRequest } from "next/server";
import db from "@/lib/prisma";
import { ok, handleError } from "@/lib/api-helpers";

const parseNullableDate = (value: unknown) => {
  if (!value || typeof value !== "string") return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
};

async function saveVisaProfile(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;
    const body = await req.json();

    const profile = await db.studentVisaProfile.upsert({
      where: {
        studentId,
      },
      create: {
        studentId,
        depositDeadlineDate: parseNullableDate(body.depositDeadlineDate),
        depositStatus: body.depositStatus,
        ihsPaidStatus: body.ihsPaidStatus,
        visaPaidStatus: body.visaPaidStatus,
        casDeadlineDate: parseNullableDate(body.casDeadlineDate),
        casStatus: body.casStatus,
        visaStatus: body.visaStatus,
        universityStartDate: parseNullableDate(body.universityStartDate),
      },
      update: {
        depositDeadlineDate: parseNullableDate(body.depositDeadlineDate),
        depositStatus: body.depositStatus,
        ihsPaidStatus: body.ihsPaidStatus,
        visaPaidStatus: body.visaPaidStatus,
        casDeadlineDate: parseNullableDate(body.casDeadlineDate),
        casStatus: body.casStatus,
        visaStatus: body.visaStatus,
        universityStartDate: parseNullableDate(body.universityStartDate),
      },
    });

    return ok(profile, "Visa profile saved successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return saveVisaProfile(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return saveVisaProfile(req, context);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;

    const profile = await db.studentVisaProfile.findUnique({
      where: {
        studentId,
      },
    });

    return ok(profile, "Visa profile fetched successfully");
  } catch (error) {
    return handleError(error);
  }
}
