import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments?.length) {
      return NextResponse.json(
        {
          success: false,
          message: "File path is required",
        },
        {
          status: 400,
        },
      );
    }

    const uploadsDirectory = path.resolve(process.cwd(), "public", "uploads");

    const requestedFile = path.resolve(uploadsDirectory, ...pathSegments);

    if (
      requestedFile !== uploadsDirectory &&
      !requestedFile.startsWith(`${uploadsDirectory}${path.sep}`)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file path",
        },
        {
          status: 403,
        },
      );
    }

    const fileStats = await stat(requestedFile);

    if (!fileStats.isFile()) {
      return NextResponse.json(
        {
          success: false,
          message: "File not found",
        },
        {
          status: 404,
        },
      );
    }

    const fileBuffer = await readFile(requestedFile);

    const extension = path.extname(requestedFile).toLowerCase();

    const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === "ENOENT" || nodeError.code === "ENOTDIR") {
      return NextResponse.json(
        {
          success: false,
          message: "File not found",
        },
        {
          status: 404,
        },
      );
    }

    console.error("[UPLOAD_FILE_GET_ERROR]", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load file",
      },
      {
        status: 500,
      },
    );
  }
}
