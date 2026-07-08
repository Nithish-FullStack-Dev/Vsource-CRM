import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';
import db from '@/lib/prisma';
import { buildDocumentChecklist } from '@/lib/loan-application/server';

type Ctx = {
  params: Promise<{
    id: string;
  }>;
};

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'doc',
  'docx',
];

const getExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
};

export async function GET(_: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    // Check whether loan application exists
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
          message: 'Loan application not found',
        },
        {
          status: 404,
        }
      );
    }

    const documents = await db.loanDocument.findMany({
      where: {
        applicationId: id,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return NextResponse.json({
      data: {
        checklist: buildDocumentChecklist(documents),
      },
    });
  } catch (error) {
    console.error('GET loan documents error:', error);

    return NextResponse.json(
      {
        message: 'Failed to load document checklist',
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  let savedFilePath: string | null = null;

  try {
    const { id } = await ctx.params;

    // Check whether loan application exists
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
          message: 'Loan application not found',
        },
        {
          status: 404,
        }
      );
    }

    const formData = await req.formData();

    const documentCode = String(
      formData.get('documentCode') ?? ''
    ).trim();

    const remarks = String(formData.get('remarks') ?? '').trim();

    const file = formData.get('file');

    if (!documentCode) {
      return NextResponse.json(
        {
          message: 'Document code is required',
        },
        {
          status: 400,
        }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message: 'File is required',
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: 'File must be 15 MB or smaller',
        },
        {
          status: 400,
        }
      );
    }

    const extension = getExtension(file.name);

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          message: 'Invalid file type',
        },
        {
          status: 400,
        }
      );
    }

    const uploadDirectory = path.join(
      process.cwd(),
      'public',
      'uploads',
      'loan-applications',
      id
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const documentId = crypto.randomUUID();

    const storedFileName = `${documentCode}-${documentId}.${extension}`;

    savedFilePath = path.join(
      uploadDirectory,
      storedFileName
    );

    const fileBuffer = Buffer.from(
      await file.arrayBuffer()
    );

    await writeFile(savedFilePath, fileBuffer);

    const created = await db.$transaction(async (tx) => {
      const document = await tx.loanDocument.create({
        data: {
          id: documentId,
          applicationId: id,

          documentCode,
          documentType: extension.toUpperCase(),

          originalFileName: file.name,
          storedFileName,

          fileUrl: `/uploads/loan-applications/${id}/${storedFileName}`,

          mimeType:
            file.type || 'application/octet-stream',

          fileSize: file.size,

          remarks: remarks || null,

          // Required by current Prisma schema
          updatedAt: new Date(),
        },
      });

      await tx.loanActivity.create({
        data: {
          id: crypto.randomUUID(),
          applicationId: id,
          type: 'document',
          title: 'Document uploaded',
          description: `${file.name} uploaded.`,
        },
      });

      return document;
    });

    return NextResponse.json(
      {
        message: 'Document uploaded successfully',
        data: created,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error('POST loan document error:', error);

    // Remove uploaded file if database operation fails
    if (savedFilePath) {
      try {
        await unlink(savedFilePath);
      } catch (cleanupError) {
        console.error(
          'Failed to remove uploaded file:',
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        message:
          error?.message ||
          'Failed to upload document',
      },
      {
        status: 500,
      }
    );
  }
}