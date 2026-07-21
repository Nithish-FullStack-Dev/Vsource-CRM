/**
 * Shared report ownership rules.
 *
 * Both Performance Reports and Directors Reports must use this file so that
 * the same CRM record can never be attributed to different users in different
 * reports.
 *
 * Canonical ownership policy:
 * 1. Open walk-in: latest assigned user; creator only when never assigned.
 * 2. Converted student: convertedBy user; Student.counselor fallback.
 * 3. Application/CAS/Visa: same owner as the converted student.
 * 4. Loan: fintech assignee; loan counselor fallback; student owner fallback.
 *
 * One stage has exactly one final owner.
 */

export const UNASSIGNED_REPORT_OWNER_ID = "__unassigned__";

export type ReportOwnerPerson = {
  id: string;
  name: string;
};

export type ReportOwnerSource =
  | "latest_assignment"
  | "creator"
  | "converted_by"
  | "student_counselor"
  | "fintech_assignee"
  | "loan_counselor"
  | "loan_creator"
  | "unassigned";

export type ResolvedReportOwner = ReportOwnerPerson & {
  source: ReportOwnerSource;
};

export type ReportLeadAssignment = {
  counselorId: string;
  assignedAt: Date;
  isPrimary?: boolean;
  counselor?: ReportOwnerPerson | null;
};

export type ReportLeadOwnerInput = {
  createdById: string | null;
  createdBy?: ReportOwnerPerson | null;
  convertedById?: string | null;
  convertedBy?: ReportOwnerPerson | null;
  convertedAt?: Date | null;
  counselors: ReadonlyArray<ReportLeadAssignment>;
};

export type ReportStudentOwnerInput = {
  counselorId: string | null;
  counselor?: ReportOwnerPerson | null;
  lead: ReportLeadOwnerInput;
};

export type ReportLoanOwnerInput = {
  fintechAssigneeId?: string | null;
  fintechAssignee?: ReportOwnerPerson | null;
  counselorId?: string | null;
  counselor?: ReportOwnerPerson | null;
  createdById?: string | null;
  createdBy?: ReportOwnerPerson | null;
  lead?:
    | (ReportLeadOwnerInput & {
        student?: {
          counselorId: string | null;
          counselor?: ReportOwnerPerson | null;
        } | null;
      })
    | null;
};

function owner(
  id: string | null | undefined,
  person: ReportOwnerPerson | null | undefined,
  fallbackName: string,
  source: ReportOwnerSource,
): ResolvedReportOwner | null {
  if (!id) {
    return null;
  }

  return {
    id,
    name: person?.name?.trim() || fallbackName,
    source,
  };
}

function unassigned(): ResolvedReportOwner {
  return {
    id: UNASSIGNED_REPORT_OWNER_ID,
    name: "Unassigned",
    source: "unassigned",
  };
}

function latestAssignment(
  assignments: ReadonlyArray<ReportLeadAssignment>,
): ReportLeadAssignment | null {
  return (
    [...assignments].sort(
      (a, b) =>
        b.assignedAt.getTime() - a.assignedAt.getTime() ||
        Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) ||
        b.counselorId.localeCompare(a.counselorId),
    )[0] ?? null
  );
}

/**
 * Resolves the single current walk-in owner.
 *
 * A later assignment always moves the walk-in away from the creator.
 * isPrimary is only a tie-breaker when two assignment timestamps are equal.
 */
export function resolveFinalLeadOwner(
  lead: ReportLeadOwnerInput,
): ResolvedReportOwner {
  const assignment = latestAssignment(lead.counselors);

  return (
    owner(
      assignment?.counselorId,
      assignment?.counselor,
      "Assigned User",
      "latest_assignment",
    ) ??
    owner(lead.createdById, lead.createdBy, "Created User", "creator") ??
    unassigned()
  );
}

/**
 * Resolves the single converted-student owner.
 *
 * The user who performed the conversion is authoritative. Student.counselorId
 * is used only when convertedById was not captured.
 */
export function resolveFinalStudentOwner(
  student: ReportStudentOwnerInput,
): ResolvedReportOwner {
  return (
    owner(
      student.lead.convertedById,
      student.lead.convertedBy,
      "Converted User",
      "converted_by",
    ) ??
    owner(
      student.counselorId,
      student.counselor,
      "Student Counsellor",
      "student_counselor",
    ) ??
    resolveFinalLeadOwner(student.lead)
  );
}

/**
 * Resolves the single loan owner without also duplicating the walk-in/student.
 */
export function resolveFinalLoanOwner(
  loan: ReportLoanOwnerInput,
): ResolvedReportOwner {
  const directOwner =
    owner(
      loan.fintechAssigneeId,
      loan.fintechAssignee,
      "Fintech Assignee",
      "fintech_assignee",
    ) ??
    owner(
      loan.counselorId,
      loan.counselor,
      "Loan Counsellor",
      "loan_counselor",
    );

  if (directOwner) {
    return directOwner;
  }

  if (loan.lead?.student) {
    return resolveFinalStudentOwner({
      counselorId: loan.lead.student.counselorId,
      counselor: loan.lead.student.counselor,
      lead: loan.lead,
    });
  }

  if (loan.lead) {
    const convertedOwner = owner(
      loan.lead.convertedById,
      loan.lead.convertedBy,
      "Converted User",
      "converted_by",
    );

    return convertedOwner ?? resolveFinalLeadOwner(loan.lead);
  }

  return (
    owner(loan.createdById, loan.createdBy, "Loan Created User", "loan_creator") ??
    unassigned()
  );
}

export function reportOwnerMatches(
  ownerValue: ReportOwnerPerson,
  ownerId: string | null | undefined,
): boolean {
  return !ownerId || ownerValue.id === ownerId;
}
