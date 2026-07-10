import type { Prisma } from "@/generated/prisma/client";
import db from "@/lib/prisma";

type DatabaseClient = Prisma.TransactionClient | typeof db;

type AssignLeadInput = {
  leadId: string;
  counselorId: string;
  assignedById?: string | null;
};

export async function resolveCurrentLeadCounselorId(
  client: DatabaseClient,
  leadId: string,
): Promise<string> {
  const lead = await client.lead.findUnique({
    where: { id: leadId },
    select: {
      createdById: true,
      counselors: {
        orderBy: [{ isPrimary: "desc" }, { assignedAt: "desc" }],
        take: 1,
        select: { counselorId: true },
      },
    },
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  const counselorId = lead.counselors[0]?.counselorId ?? lead.createdById;

  if (!counselorId) {
    throw new Error("Assign a counsellor before converting this lead");
  }

  return counselorId;
}

export async function syncConvertedStudentCounselor(
  client: DatabaseClient,
  leadId: string,
): Promise<string> {
  const counselorId = await resolveCurrentLeadCounselorId(client, leadId);

  await client.student.update({
    where: { leadId },
    data: { counselorId },
  });

  return counselorId;
}

export async function assignLeadToCounselor({
  leadId,
  counselorId,
  assignedById = null,
}: AssignLeadInput) {
  return db.$transaction(async (tx) => {
    const [lead, counselor] = await Promise.all([
      tx.lead.findUnique({
        where: { id: leadId },
        select: { id: true, branchId: true, student: { select: { id: true } } },
      }),
      tx.user.findUnique({
        where: { id: counselorId },
        select: { id: true, branches: { select: { id: true } } },
      }),
    ]);

    if (!lead) {
      throw new Error("Lead not found");
    }

    if (!counselor) {
      throw new Error("Counsellor not found");
    }

    if (!counselor.branches.some((branch) => branch.id === lead.branchId)) {
      throw new Error("The counsellor is not assigned to the lead branch");
    }

    await tx.leadCounselor.updateMany({
      where: { leadId, isPrimary: true },
      data: { isPrimary: false },
    });

    const assignment = await tx.leadCounselor.upsert({
      where: {
        leadId_counselorId: {
          leadId,
          counselorId,
        },
      },
      create: {
        leadId,
        counselorId,
        assignedById,
        assignedAt: new Date(),
        isPrimary: true,
      },
      update: {
        assignedById,
        assignedAt: new Date(),
        isPrimary: true,
      },
    });

    if (lead.student) {
      await tx.student.update({
        where: { id: lead.student.id },
        data: { counselorId },
      });
    }

    return assignment;
  });
}
