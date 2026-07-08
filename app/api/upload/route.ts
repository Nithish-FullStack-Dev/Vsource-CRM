import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "File is required",
        },
        {
          status: 400,
        },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only JPG, PNG, WebP, GIF and SVG files are allowed",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "File size must not exceed 5MB",
        },
        {
          status: 400,
        },
      );
    }

    const extension =
      EXTENSIONS[file.type] || path.extname(file.name).toLowerCase() || ".bin";

    const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "universities",
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    const filePath = path.join(uploadDirectory, fileName);

    await writeFile(filePath, buffer);

    const fileUrl = `/api/upload/universities/${fileName}`;

    return NextResponse.json(
      {
        success: true,
        message: "File uploaded successfully",
        data: {
          url: fileUrl,
          fileName,
          originalName: file.name,
          size: file.size,
          type: file.type,
        },
        url: fileUrl,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("[UPLOAD_POST_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload file",
      },
      {
        status: 500,
      },
    );
  }
}
