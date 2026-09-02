// lib\loan\get-loan-student.ts
import  db  from "@/lib/prisma";

export async function getLoanApplicationStudent(applicationId: string) {
  const application = await db.loanApplication.findUnique({
    where: {
      id: applicationId,
    },
    select: {
      id: true,
      lead: {
        select: {
          id: true,
          student: {
            select: {
              id: true,
              studentName: true,
              branchId: true,
            },
          },
        },
      },
    },
  });

  if (!application) {
    throw new Error("Loan application not found.");
  }

  const student = application.lead?.student;

  if (!student) {
    throw new Error(
      "This loan application is not linked to a converted student.",
    );
  }

  return {
    application,
    student,
  };
}
