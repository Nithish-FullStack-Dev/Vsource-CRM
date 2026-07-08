import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { bankApplicationSchema } from '@/schemas/loan-application/loan-application.schema';
type Ctx = { params: Promise<{ id: string; bankId: string }> };
const toDate = (v?: string | null) => (v ? new Date(v) : null);
const money = (v?: number | null) => (typeof v === 'number' ? v : null);
export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const { id, bankId } = await ctx.params;
    const v = bankApplicationSchema.partial().parse(await req.json());
    const existing = await db.loanBankApplication.findUnique({
      where: { id: bankId },
    });
    if (!existing || existing.applicationId !== id)
      return NextResponse.json(
        { message: 'Bank application not found' },
        { status: 404 }
      );
    const updated = await db.loanBankApplication.update({
      where: { id: bankId },
      data: {
        bank: v.bank,
        branch: v.branch,
        applicationNo: v.applicationNo,
        loginDate: v.loginDate !== undefined ? toDate(v.loginDate) : undefined,
        appliedAmount:
          v.appliedAmount !== undefined ? money(v.appliedAmount) : undefined,
        sanctionedAmount:
          v.sanctionedAmount !== undefined
            ? money(v.sanctionedAmount)
            : undefined,
        sanctionDate:
          v.sanctionDate !== undefined ? toDate(v.sanctionDate) : undefined,
        disbursedAmount:
          v.disbursedAmount !== undefined
            ? money(v.disbursedAmount)
            : undefined,
        disbursementDate:
          v.disbursementDate !== undefined
            ? toDate(v.disbursementDate)
            : undefined,
        roi: v.roi !== undefined ? money(v.roi) : undefined,
        tenure: v.tenure !== undefined ? Number(v.tenure) : undefined,
        status: v.status,
        remarks: v.remarks,
      },
    });
    return NextResponse.json({ data: updated });
  } catch (error: any) {
    return NextResponse.json(
      {
        message:
          error?.issues?.[0]?.message ||
          error?.message ||
          'Failed to update bank application',
      },
      { status: 400 }
    );
  }
}
export async function DELETE(_: NextRequest, ctx: Ctx) {
  try {
    const { id, bankId } = await ctx.params;
    const existing = await db.loanBankApplication.findUnique({
      where: { id: bankId },
    });
    if (!existing || existing.applicationId !== id)
      return NextResponse.json(
        { message: 'Bank application not found' },
        { status: 404 }
      );
    await db.loanBankApplication.delete({ where: { id: bankId } });
    return NextResponse.json({
      message: 'Bank application deleted successfully',
    });
  } catch (e) {
    return NextResponse.json(
      { message: 'Failed to delete bank application' },
      { status: 500 }
    );
  }
}
