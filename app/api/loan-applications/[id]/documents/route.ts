// app\api\loan-applications\[id]\documents\route.ts

import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import db from "@/lib/prisma";
import { buildDocumentChecklist } from "@/lib/loan-application/server";
import { LOAN_DOCUMENT_CHECKLIST } from "@/lib/loan-application/constants";
import { badRequest } from "@/lib/api-helpers";

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"];

const getExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
};

export async function GET(_: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
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

    if (!application) {
      return badRequest("Loan application not found.");
    }

    const studentId = application.lead?.student?.id;

    if (!studentId) {
      return badRequest(
        "This loan application is not linked to a converted student.",
      );
    }

    const [
      customMasters,
      loanDocuments,
      studentDocuments,
      studentCustomMasters,
    ] = await Promise.all([
      // Loan custom document masters
      db.loanDocumentMaster.findMany({
        where: {
          applicationId: id,
          category: "OTHER",
          isSystem: false,
          isActive: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),
      db.loanDocument.findMany({
        where: {
          applicationId: id,
        },
        orderBy: {
          uploadedAt: "desc",
        },
      }),
      db.studentDocument.findMany({
        where: {
          studentId,
        },
        orderBy: {
          uploadedAt: "desc",
        },
      }),
      db.studentDocumentMaster.findMany({
        where: {
          studentId,
          isActive: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),
    ]);

    const normalizedLoanDocuments = loanDocuments.map((document) => ({
      id: document.id,
      applicationId: document.applicationId,
      studentId: null,
      documentMasterId: document.documentMasterId,
      documentCode: document.documentCode,
      documentType: document.documentType,
      originalFileName: document.originalFileName,
      storedFileName: document.storedFileName,
      fileUrl: document.fileUrl,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      remarks: document.remarks,
      uploadedAt: document.uploadedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      source: "LOAN" as const,
      studentDocumentId: null,
    }));

    const checklist = buildDocumentChecklist(
      normalizedLoanDocuments,
      customMasters,
      studentDocuments,
      studentCustomMasters,
    );

    return NextResponse.json({
      data: {
        checklist,
      },
    });
  } catch (error) {
    console.error("GET loan documents error:", error);

    return NextResponse.json(
      {
        message: "Failed to load document checklist",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  let savedFilePath: string | null = null;

  try {
    const { id } = await ctx.params;

    const application = await db.loanApplication.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        {
          message: "Loan application not found",
        },
        {
          status: 404,
        },
      );
    }

    const formData = await req.formData();

    const documentCode = String(formData.get("documentCode") ?? "").trim();

    const submittedDocumentMasterId = String(
      formData.get("documentMasterId") ?? "",
    ).trim();

    const remarks = String(formData.get("remarks") ?? "").trim();

    const file = formData.get("file");

    if (!documentCode) {
      return NextResponse.json(
        {
          message: "Document code is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message: "File is required",
        },
        {
          status: 400,
        },
      );
    }

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

    const extension = getExtension(file.name);

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          message: "Invalid file type",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * KYC and OPTIONAL definitions come from the static checklist.
     */
    const staticChecklistItem = LOAN_DOCUMENT_CHECKLIST.find(
      (item) => item.code === documentCode,
    );

    let resolvedDocumentMaster: {
      id: string;
      code: string;
      name: string;
      category: "KYC" | "OPTIONAL" | "OTHER";
      required: boolean;
    };

    if (staticChecklistItem) {
      /*
       * The UI still uses LOAN_DOCUMENT_CHECKLIST.
       *
       * This system master is only used to satisfy the required
       * LoanDocument.documentMasterId foreign key.
       */
      const systemMaster = await db.loanDocumentMaster.upsert({
        where: {
          code: staticChecklistItem.code,
        },
        update: {
          name: staticChecklistItem.name,
          category: staticChecklistItem.category,
          required: staticChecklistItem.required,
          isSystem: true,
          isActive: true,
          applicationId: null,
          updatedAt: new Date(),
        },
        create: {
          id: crypto.randomUUID(),
          code: staticChecklistItem.code,
          name: staticChecklistItem.name,
          category: staticChecklistItem.category,
          required: staticChecklistItem.required,
          isSystem: true,
          isActive: true,
          applicationId: null,
          sortOrder: LOAN_DOCUMENT_CHECKLIST.findIndex(
            (item) => item.code === staticChecklistItem.code,
          ),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          required: true,
        },
      });

      resolvedDocumentMaster = systemMaster;
    } else {
      /*
       * Custom OTHER documents must provide a real master ID.
       */
      if (!submittedDocumentMasterId) {
        return NextResponse.json(
          {
            message: "Document master ID is required for custom documents",
          },
          {
            status: 400,
          },
        );
      }

      const customMaster = await db.loanDocumentMaster.findFirst({
        where: {
          id: submittedDocumentMasterId,
          applicationId: id,
          code: documentCode,
          category: "OTHER",
          isSystem: false,
          isActive: true,
        },
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          required: true,
        },
      });

      if (!customMaster) {
        return NextResponse.json(
          {
            message: "Invalid custom document type",
          },
          {
            status: 400,
          },
        );
      }

      resolvedDocumentMaster = customMaster;
    }

    const existingDocument = await db.loanDocument.findFirst({
      where: {
        applicationId: id,
        documentMasterId: resolvedDocumentMaster.id,
      },
      select: {
        id: true,
      },
    });

    if (existingDocument) {
      return NextResponse.json(
        {
          message:
            "This document has already been uploaded. Use replace instead.",
        },
        {
          status: 409,
        },
      );
    }

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "loan-applications",
      id,
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const documentId = crypto.randomUUID();

    const storedFileName = `${resolvedDocumentMaster.code}-${documentId}.${extension}`;

    savedFilePath = path.join(uploadDirectory, storedFileName);

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(savedFilePath, fileBuffer);

    const created = await db.$transaction(async (tx) => {
      const document = await tx.loanDocument.create({
        data: {
          id: documentId,
          applicationId: id,

          // Always a valid string because the schema requires it.
          documentMasterId: resolvedDocumentMaster.id,

          documentCode: resolvedDocumentMaster.code,
          documentType: extension.toUpperCase(),
          originalFileName: file.name,
          storedFileName,
          fileUrl: `/uploads/loan-applications/${id}/${storedFileName}`,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          remarks: remarks || null,
        },
      });

      await tx.loanActivity.create({
        data: {
          id: crypto.randomUUID(),
          applicationId: id,
          type: "document",
          title: "Document uploaded",
          description: `${resolvedDocumentMaster.name} uploaded as ${file.name}.`,
        },
      });

      return document;
    });

    return NextResponse.json(
      {
        message: "Document uploaded successfully",
        data: created,
      },
      {
        status: 201,
      },
    );
  } catch (error: unknown) {
    console.error("POST loan document error:", error);

    if (savedFilePath) {
      try {
        await unlink(savedFilePath);
      } catch (cleanupError) {
        console.error("Failed to remove uploaded file:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to upload document",
      },
      {
        status: 500,
      },
    );
  }
}
