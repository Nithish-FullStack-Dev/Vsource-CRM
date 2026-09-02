// app\api\students\[id]\documents\route.ts
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";
import { LOAN_DOCUMENT_CHECKLIST } from "@/lib/loan-application/constants";
import { STUDENT_DOCUMENT_CHECKLIST } from "@/lib/student-document-checklist";
import {
  buildStudentDocumentFileName,
  validateStudentDocument,
} from "@/lib/student-document-utils";
import { handleError } from "@/lib/api-helpers";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;

    const student = await db.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,

        documents: {
          orderBy: {
            uploadedAt: "desc",
          },
        },

        documentMasters: {
          where: {
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
        },

        lead: {
          select: {
            loanApplication: {
              select: {
                id: true,

                documents: {
                  orderBy: {
                    uploadedAt: "desc",
                  },
                },

                documentMasters: {
                  where: {
                    isActive: true,
                    category: "OTHER",
                    isSystem: false,
                  },
                  orderBy: [
                    {
                      sortOrder: "asc",
                    },
                    {
                      createdAt: "asc",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return errorResponse("Student not found", 404);
    }
    const systemChecklist = STUDENT_DOCUMENT_CHECKLIST.map((item) => {
      const documents = student.documents.filter(
        (document) =>
          document.documentCode === item.code && !document.documentMasterId,
      );

      return {
        ...item,

        documentMasterId: null,

        isSystem: true,
        isOptional: false,
        isMandatory: true,

        module: item.category.startsWith("LOAN")
          ? ("LOAN" as const)
          : ("ADMISSION" as const),

        source: "STUDENT_SHARED" as const,

        documents,

        uploadedCount: documents.length,

        isComplete: documents.length >= item.requiredCount,

        loanApplicationId: null,
      };
    });
    const customChecklist = student.documentMasters.map((master) => {
      const documents = student.documents.filter(
        (document) => document.documentMasterId === master.id,
      );

      return {
        code: master.code,
        name: master.name,
        category: "OTHER" as const,

        documentMasterId: master.id,

        requiredCount: master.required ? 1 : 0,
        required: master.required,

        isMandatory: master.required,
        isOptional: !master.required,
        isSystem: false,

        module: "OTHER" as const,

        source: "STUDENT_SHARED" as const,

        documents,

        uploadedCount: documents.length,

        isComplete: documents.length > 0,

        loanApplicationId: null,
      };
    });
    const loanApplication = student.lead?.loanApplication ?? null;

    const loanApplicationId = loanApplication?.id ?? null;

    const loanDocuments = loanApplication?.documents ?? [];

    const loanDocumentMasters = loanApplication?.documentMasters ?? [];
    const normalizedLoanDocuments = loanDocuments.map((document) => ({
      id: document.id,

      studentId,

      applicationId: document.applicationId,

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
      documentMasterId: document.documentMasterId,

      source: "LOAN" as const,

      loanApplicationId: document.applicationId,
    }));
    const loanSystemChecklist = LOAN_DOCUMENT_CHECKLIST.map((item) => {
      const documents = normalizedLoanDocuments.filter(
        (document) => document.documentCode === item.code,
      );

      return {
        code: item.code,
        name: item.name,

        category: item.category,

        documentMasterId: null,

        requiredCount: item.required ? 1 : 0,

        required: item.required,

        isMandatory: item.required,
        isOptional: !item.required,

        isSystem: true,

        module: "LOAN" as const,

        source: "LOAN" as const,

        documents,

        uploadedCount: documents.length,

        isComplete: documents.length > 0,
        loanApplicationId,
      };
    });
    const loanCustomChecklist = loanDocumentMasters.map((master) => {
      const documents = normalizedLoanDocuments.filter(
        (document) => document.documentMasterId === master.id,
      );

      return {
        code: master.code,
        name: master.name,

        category: "OTHER" as const,

        documentMasterId: master.id,

        requiredCount: master.required ? 1 : 0,

        required: master.required,

        isMandatory: master.required,
        isOptional: !master.required,

        isSystem: false,

        module: "LOAN" as const,

        source: "LOAN" as const,

        documents,

        uploadedCount: documents.length,

        isComplete: documents.length > 0,

        loanApplicationId,
      };
    });
    const checklist = [
      ...systemChecklist,
      ...customChecklist,
      ...loanSystemChecklist,
      ...loanCustomChecklist,
    ];
    const totalRequiredUploads = checklist.reduce(
      (total, item) => total + item.requiredCount,
      0,
    );

    const completedRequiredUploads = checklist.reduce(
      (total, item) => total + Math.min(item.uploadedCount, item.requiredCount),
      0,
    );

    const completedChecklistItems = checklist.filter(
      (item) => item.isComplete,
    ).length;

    const summary = {
      totalChecklistItems: checklist.length,

      completedChecklistItems,

      pendingChecklistItems: checklist.length - completedChecklistItems,

      totalRequiredUploads,

      completedRequiredUploads,

      percentage:
        totalRequiredUploads === 0
          ? 0
          : Math.round((completedRequiredUploads / totalRequiredUploads) * 100),
    };

    return NextResponse.json({
      success: true,

      data: {
        checklist,

        summary,

        hasUploadedDocuments:
          student.documents.length > 0 || loanDocuments.length > 0,
      },
    });
  } catch (error) {
    console.error("[student-documents:get]", error);

    return handleError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: studentId } = await params;

    const formData = await req.formData();

    const file = formData.get("file");

    const documentCode = String(formData.get("documentCode") || "").trim();

    const remarks = String(formData.get("remarks") || "").trim();

    if (!(file instanceof File)) {
      return errorResponse("Document file is required", 400);
    }
    const systemChecklistItem = STUDENT_DOCUMENT_CHECKLIST.find(
      (item) => item.code === documentCode,
    );
    const customDocumentMaster = systemChecklistItem
      ? null
      : await db.studentDocumentMaster.findFirst({
          where: {
            studentId,
            code: documentCode,
            isActive: true,
          },
        });

    if (!systemChecklistItem && !customDocumentMaster) {
      return errorResponse("Invalid document type", 400);
    }

    const documentName =
      systemChecklistItem?.name ||
      customDocumentMaster?.name ||
      "Student Document";
    const student = await db.student.findUnique({
      where: {
        id: studentId,
      },
      select: {
        id: true,
        studentName: true,

        branch: {
          select: {
            code: true,
          },
        },
      },
    });

    if (!student) {
      return errorResponse("Student not found", 404);
    }
    const extension = validateStudentDocument(file);
    const storedFileName = buildStudentDocumentFileName({
      studentName: student.studentName,
      documentName,
      branchCode: student.branch?.code || "branch",
      extension,
    });

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "students",
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDirectory, storedFileName), buffer, {
      flag: "wx",
    });
    const document = await db.studentDocument.create({
      data: {
        studentId,

        documentCode,

        documentType: documentName,

        documentMasterId: customDocumentMaster?.id || null,

        originalFileName: file.name,

        storedFileName,

        fileUrl: `/uploads/students/${storedFileName}`,

        mimeType: file.type,

        fileSize: file.size,

        remarks: remarks || null,
      },
    });

    return NextResponse.json(
      {
        success: true,

        data: document,

        message: "Document uploaded successfully",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("[student-documents:post]", error);

    return handleError(error);
  }
}
