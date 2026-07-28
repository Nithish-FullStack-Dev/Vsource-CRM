// app\api\students\[id]\documents\types\route.ts

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/api-helpers";
import db from "@/lib/prisma";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;

    const body = (await req.json()) as {
      name?: string;
      required?: boolean;
    };

    const name = String(body.name || "").trim();
    const required = body.required === true;

    if (name.length < 2) {
      return errorResponse(
        "Document name must contain at least 2 characters",
        400,
      );
    }

    if (name.length > 100) {
      return errorResponse("Document name cannot exceed 100 characters", 400);
    }

    const student = await db.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      return errorResponse("Student not found", 404);
    }

    const existingDocumentType = await db.studentDocumentMaster.findFirst({
      where: {
        studentId,
        name: {
          equals: name,
          mode: "insensitive",
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (existingDocumentType) {
      return errorResponse(
        "A document type with this name already exists",
        409,
      );
    }

    const code = `OTHER_${randomUUID()
      .replaceAll("-", "")
      .slice(0, 20)
      .toUpperCase()}`;

    const documentType = await db.studentDocumentMaster.create({
      data: {
        studentId,
        code,
        name,
        required,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...documentType,
          isSystem: false,
          isOptional: !documentType.required,
          module: "OTHER",
        },
        message: "Document type added successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[student-document-types:post]", error);
    return handleError(error);
  }
}
