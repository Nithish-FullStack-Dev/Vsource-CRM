import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { handleError } from "@/lib/api-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const sanction = await db.loanSanction.findUnique({
      where: {
        applicationId: id,
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        bankApplication: {
          select: {
            id: true,
            applicationNo: true,
            applicationDate: true,
          },
        },
      },
    });

    return NextResponse.json(sanction);
  } catch (error) {
    console.error("GET LOAN SANCTION ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to load sanction details",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      bankId,
      bankApplicationId,
      sanctionNo,
      sanctionDate,
      sanctionedAmount,
      roi,
      tenure,
      moratorium,
      processingFee,
      insuranceAmount,
      sanctionLetter,
      expiryDate,
      remarks,
    } = body;

    const updatedSanction = await db.loanSanction.upsert({
      where: {
        applicationId: id,
      },
      update: {
        bankId,
        bankApplicationId: bankApplicationId || null,
        sanctionNo: sanctionNo || null,
        sanctionDate: sanctionDate ? new Date(sanctionDate) : null,
        sanctionedAmount: sanctionedAmount != null ? sanctionedAmount : null,
        roi: roi != null ? roi : null,
        tenure: tenure != null ? Number(tenure) : null,
        moratorium: moratorium || null,
        processingFee: processingFee != null ? processingFee : null,
        insuranceAmount: insuranceAmount != null ? insuranceAmount : null,
        sanctionLetter: sanctionLetter || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        remarks: remarks || null,
      },
      create: {
        applicationId: id,
        bankId,
        bankApplicationId: bankApplicationId || null,
        sanctionNo: sanctionNo || null,
        sanctionDate: sanctionDate ? new Date(sanctionDate) : null,
        sanctionedAmount: sanctionedAmount != null ? sanctionedAmount : null,
        roi: roi != null ? roi : null,
        tenure: tenure != null ? Number(tenure) : null,
        moratorium: moratorium || null,
        processingFee: processingFee != null ? processingFee : null,
        insuranceAmount: insuranceAmount != null ? insuranceAmount : null,
        sanctionLetter: sanctionLetter || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        remarks: remarks || null,
      },
    });

    return NextResponse.json(updatedSanction);
  } catch (error) {
    console.error("PUT LOAN SANCTION ERROR:", error);
    return handleError(error);
  }
}
