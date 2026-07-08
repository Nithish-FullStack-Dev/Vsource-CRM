import { NextRequest, NextResponse } from 'next/server';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import db from '@/lib/prisma';
type Ctx = { params: Promise<{ id: string; documentId: string }> };
const OK = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx'];
const ext = (n: string) => n.split('.').pop()?.toLowerCase() ?? '';
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id, documentId } = await ctx.params;
    const old = await db.loanDocument.findUnique({ where: { id: documentId } });
    if (!old || old.applicationId !== id)
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    const form = await req.formData();
    const remarks = String(form.get('remarks') ?? '');
    const file = form.get('file');
    const data: any = { remarks: remarks || null };
    if (file instanceof File) {
      const e = ext(file.name);
      if (!OK.includes(e))
        return NextResponse.json(
          { message: 'Invalid file type' },
          { status: 400 }
        );
      const dir = path.join(
        process.cwd(),
        'public',
        'uploads',
        'loan-applications',
        id
      );
      await mkdir(dir, { recursive: true });
      const storedFileName = `${old.documentCode}-${Date.now()}.${e}`;
      await writeFile(
        path.join(dir, storedFileName),
        Buffer.from(await file.arrayBuffer())
      );
      Object.assign(data, {
        originalFileName: file.name,
        storedFileName,
        fileUrl: `/uploads/loan-applications/${id}/${storedFileName}`,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        documentType: e.toUpperCase(),
        uploadedAt: new Date(),
      });
      try {
        await unlink(path.join(process.cwd(), 'public', old.fileUrl));
      } catch {}
    }
    const updated = await db.loanDocument.update({
      where: { id: documentId },
      data,
    });
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error?.message || 'Failed to replace document' },
      { status: 500 }
    );
  }
}
export async function DELETE(_: NextRequest, ctx: Ctx) {
  try {
    const { id, documentId } = await ctx.params;
    const doc = await db.loanDocument.findUnique({ where: { id: documentId } });
    if (!doc || doc.applicationId !== id)
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    await db.loanDocument.delete({ where: { id: documentId } });
    try {
      await unlink(path.join(process.cwd(), 'public', doc.fileUrl));
    } catch {}
    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
