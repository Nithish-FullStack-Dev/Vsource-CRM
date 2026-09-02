// app/api/students/[id]/documents/[documentId]/route.ts

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

const OK = ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"];

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

const getSource = (req: NextRequest) => {
  const source = req.nextUrl.searchParams.get("source");

  if (source === "STUDENT_SHARED" || source === "LOAN") {
    return source;
  }

  return null;
};

const removeStoredFile = async (fileUrl?: string | null) => {
  if (!fileUrl) return;

  try {
    await unlink(path.join(process.cwd(), "public", fileUrl));
  } catch {
    // File may already be missing.
  }
};

const errorResponse = (message: string, status: number) =>
  NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
    },
  );

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let savedFilePath: string | null = null;

  try {
    const { id: studentId, documentId } = await ctx.params;

    const source = getSource(req);
    if (!source) {
      return errorResponse(
        "Document source is required. Use source=STUDENT_SHARED or source=LOAN.",
        400,
      );
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
      return errorResponse("Student not found.", 404);
    }

    const old = await db.studentDocument.findFirst({
      where: {
        id: documentId,
        studentId,
      },
    });

    if (!old) {
      return errorResponse("Student document not found.", 404);
    }

    const formData = await req.formData();

    const remarks = String(formData.get("remarks") ?? "").trim();

    const file = formData.get("file");

    const data: {
      remarks: string | null;
      originalFileName?: string;
      storedFileName?: string;
      fileUrl?: string;
      mimeType?: string;
      fileSize?: number;
      documentType?: string;
      uploadedAt?: Date;
    } = {
      remarks: remarks || null,
    };
    if (file instanceof File) {
      if (file.size <= 0) {
        return errorResponse("The selected file is empty.", 400);
      }

      if (file.size > MAX_FILE_SIZE) {
        return errorResponse("File must be 15 MB or smaller.", 400);
      }

      const extension = ext(file.name);

      if (!extension || !OK.includes(extension)) {
        return errorResponse("Invalid file type.", 400);
      }
      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "students",
      );

      await mkdir(uploadDirectory, {
        recursive: true,
      });

      const storedFileName = `${old.documentCode}-${crypto.randomUUID()}.${extension}`;

      savedFilePath = path.join(uploadDirectory, storedFileName);

      await writeFile(savedFilePath, Buffer.from(await file.arrayBuffer()));

      Object.assign(data, {
        originalFileName: file.name,
        storedFileName,
        fileUrl: `/uploads/students/${storedFileName}`,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        documentType: extension.toUpperCase(),
        uploadedAt: new Date(),
      });
    }
    const updated = await db.studentDocument.update({
      where: {
        id: documentId,
      },
      data,
    });
    if (file instanceof File) {
      await removeStoredFile(old.fileUrl);
    }

    savedFilePath = null;

    return NextResponse.json({
      success: true,
      message:
        source === "STUDENT_SHARED"
          ? "Shared student document replaced successfully."
          : "Student document replaced successfully.",
      data: {
        ...updated,
        source: "STUDENT_SHARED" as const,
        studentDocumentId: updated.id,
      },
    });
  } catch (error: unknown) {
    console.error("[student-documents:patch]", error);
    if (savedFilePath) {
      try {
        await unlink(savedFilePath);
      } catch {}
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to replace document.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id: studentId, documentId } = await ctx.params;

    const source = getSource(req);

    if (!source) {
      return errorResponse(
        "Document source is required. Use source=STUDENT_SHARED or source=LOAN.",
        400,
      );
    }

    const document = await db.studentDocument.findFirst({
      where: {
        id: documentId,
        studentId,
      },
    });

    if (!document) {
      return errorResponse("Student document not found.", 404);
    }
    await db.studentDocument.delete({
      where: {
        id: documentId,
      },
    });
    await removeStoredFile(document.fileUrl);

    return NextResponse.json({
      success: true,
      message:
        source === "STUDENT_SHARED"
          ? "Shared student document deleted successfully."
          : "Student document deleted successfully.",
    });
  } catch (error: unknown) {
    console.error("[student-documents:delete]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete document.",
      },
      {
        status: 500,
      },
    );
  }
}
