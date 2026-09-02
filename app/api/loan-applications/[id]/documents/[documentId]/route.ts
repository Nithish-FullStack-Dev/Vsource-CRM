// app\api\loan-applications\[id]\documents\[documentId]\route.ts
import { NextRequest, NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import db from "@/lib/prisma";

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

  return source === "STUDENT_SHARED" ? "STUDENT_SHARED" : "LOAN";
};

export async function PATCH(req: NextRequest, ctx: Ctx) {
  let newFilePath: string | null = null;

  try {
    const { id, documentId } = await ctx.params;
    const source = getSource(req);
    if (source === "STUDENT_SHARED") {
      const studentDocument = await db.studentDocument.findUnique({
        where: {
          id: documentId,
        },
      });

      if (!studentDocument) {
        return NextResponse.json(
          {
            message: "Student document not found",
          },
          {
            status: 404,
          },
        );
      }
      const application = await db.loanApplication.findUnique({
        where: {
          id,
        },
        select: {
          lead: {
            select: {
              student: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      const studentId = application?.lead?.student?.id;

      if (!studentId || studentDocument.studentId !== studentId) {
        return NextResponse.json(
          {
            message: "Document does not belong to this loan application",
          },
          {
            status: 404,
          },
        );
      }

      const form = await req.formData();

      const remarks = String(form.get("remarks") ?? "").trim();

      const file = form.get("file");

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
          return NextResponse.json(
            {
              message: "The selected file is empty",
            },
            {
              status: 400,
            },
          );
        }

        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              message: "File must be 15 MB or smaller",
            },
            {
              status: 400,
            },
          );
        }

        const extension = ext(file.name);

        if (!extension || !OK.includes(extension)) {
          return NextResponse.json(
            {
              message: "Invalid file type",
            },
            {
              status: 400,
            },
          );
        }
        const dir = path.join(process.cwd(), "public", "uploads", "students");

        await mkdir(dir, {
          recursive: true,
        });

        const storedFileName = `${studentDocument.documentCode}-${crypto.randomUUID()}.${extension}`;

        newFilePath = path.join(dir, storedFileName);

        await writeFile(newFilePath, Buffer.from(await file.arrayBuffer()));

        Object.assign(data, {
          originalFileName: file.name,
          storedFileName,
          fileUrl: `/uploads/students/${storedFileName}`,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          documentType: extension.toUpperCase(),
          uploadedAt: new Date(),
        });
        const updated = await db.studentDocument.update({
          where: {
            id: documentId,
          },
          data,
        });
        try {
          await unlink(
            path.join(process.cwd(), "public", studentDocument.fileUrl),
          );
        } catch {}

        newFilePath = null;

        return NextResponse.json({
          data: {
            ...updated,
            source: "STUDENT_SHARED" as const,
            studentDocumentId: updated.id,
          },
        });
      }
      const updated = await db.studentDocument.update({
        where: {
          id: documentId,
        },
        data,
      });

      return NextResponse.json({
        data: {
          ...updated,
          source: "STUDENT_SHARED" as const,
          studentDocumentId: updated.id,
        },
      });
    }
    const old = await db.loanDocument.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!old || old.applicationId !== id) {
      return NextResponse.json(
        {
          message: "Document not found",
        },
        {
          status: 404,
        },
      );
    }

    const form = await req.formData();

    const remarks = String(form.get("remarks") ?? "").trim();

    const file = form.get("file");

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
        return NextResponse.json(
          {
            message: "The selected file is empty",
          },
          {
            status: 400,
          },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            message: "File must be 15 MB or smaller",
          },
          {
            status: 400,
          },
        );
      }

      const extension = ext(file.name);

      if (!extension || !OK.includes(extension)) {
        return NextResponse.json(
          {
            message: "Invalid file type",
          },
          {
            status: 400,
          },
        );
      }

      const dir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "loan-applications",
        id,
      );

      await mkdir(dir, {
        recursive: true,
      });

      const storedFileName = `${old.documentCode}-${crypto.randomUUID()}.${extension}`;

      newFilePath = path.join(dir, storedFileName);

      await writeFile(newFilePath, Buffer.from(await file.arrayBuffer()));

      Object.assign(data, {
        originalFileName: file.name,
        storedFileName,
        fileUrl: `/uploads/loan-applications/${id}/${storedFileName}`,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        documentType: extension.toUpperCase(),
        uploadedAt: new Date(),
      });
    }

    const updated = await db.loanDocument.update({
      where: {
        id: documentId,
      },
      data,
    });
    if (file instanceof File && newFilePath) {
      try {
        await unlink(path.join(process.cwd(), "public", old.fileUrl));
      } catch {}

      newFilePath = null;
    }

    return NextResponse.json({
      data: {
        ...updated,
        source: "LOAN" as const,
        studentDocumentId: null,
      },
    });
  } catch (error: unknown) {
    console.error("PATCH loan document error:", error);
    if (newFilePath) {
      try {
        await unlink(newFilePath);
      } catch {}
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to replace document",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const { id, documentId } = await ctx.params;
    const source = getSource(req);
    if (source === "STUDENT_SHARED") {
      const studentDocument = await db.studentDocument.findUnique({
        where: {
          id: documentId,
        },
      });

      if (!studentDocument) {
        return NextResponse.json(
          {
            message: "Student document not found",
          },
          {
            status: 404,
          },
        );
      }
      const application = await db.loanApplication.findUnique({
        where: {
          id,
        },
        select: {
          lead: {
            select: {
              student: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      const studentId = application?.lead?.student?.id;

      if (!studentId || studentDocument.studentId !== studentId) {
        return NextResponse.json(
          {
            message: "Document does not belong to this loan application",
          },
          {
            status: 404,
          },
        );
      }
      await db.studentDocument.delete({
        where: {
          id: documentId,
        },
      });
      try {
        await unlink(
          path.join(process.cwd(), "public", studentDocument.fileUrl),
        );
      } catch {}

      return NextResponse.json({
        message: "Student document deleted successfully",
      });
    }
    const doc = await db.loanDocument.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!doc || doc.applicationId !== id) {
      return NextResponse.json(
        {
          message: "Document not found",
        },
        {
          status: 404,
        },
      );
    }

    await db.loanDocument.delete({
      where: {
        id: documentId,
      },
    });
    try {
      await unlink(path.join(process.cwd(), "public", doc.fileUrl));
    } catch {}

    return NextResponse.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("DELETE loan document error:", error);

    return NextResponse.json(
      {
        message: "Failed to delete document",
      },
      {
        status: 500,
      },
    );
  }
}
