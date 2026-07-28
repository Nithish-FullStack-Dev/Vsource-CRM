const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const DROP_HOLD_DIF = new Set([
  "drop",
  "dropped",
  "inactive",
  "lost",
  "closed_lost",
  "lead_lost",
  "hold",
  "on_hold",
  "dif",
  "deferred",
]);

const LOAN_APPROVED = new Set([
  "approved",
  "sanctioned",
  "sanctioned_approved",
  "deposit_received",
  "partially_disbursed",
  "fully_disbursed",
  "disbursed",
]);

export function normalizeReportValue(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function isWalkInSource(value: unknown): boolean {
  return ["walkin", "walk_in", "walk_ins", "walk_in_lead"].includes(
    normalizeReportValue(value),
  );
}

export function isReferenceSource(value: unknown): boolean {
  const source = normalizeReportValue(value);
  return Boolean(source) && !isWalkInSource(source);
}

export function isDropHoldDif(value: unknown): boolean {
  return DROP_HOLD_DIF.has(normalizeReportValue(value));
}

export function isUniversityApplied(value: unknown): boolean {
  return normalizeReportValue(value) === "applied";
}

export function isOfferReceived(value: unknown): boolean {
  return ["priority_ucol", "priority_col", "col", "ucol", "received"].includes(
    normalizeReportValue(value),
  );
}

export function isCasApplied(value: unknown): boolean {
  return normalizeReportValue(value) === "applied";
}

export function isCasReceived(value: unknown): boolean {
  return ["received", "cas_received", "issued"].includes(
    normalizeReportValue(value),
  );
}

export function isVisaApplied(value: unknown): boolean {
  return ["decision_pending", "applied", "visa_applied"].includes(
    normalizeReportValue(value),
  );
}

export function isVisaApproved(value: unknown): boolean {
  return ["approved", "visa_approved", "granted"].includes(
    normalizeReportValue(value),
  );
}

export function isLoanApproved(value: unknown, sanctionedAmount?: unknown): boolean {
  return (
    LOAN_APPROVED.has(normalizeReportValue(value)) ||
    toReportNumber(sanctionedAmount) > 0
  );
}

export function isLoanDisbursed(
  value: unknown,
  disbursementStatus?: unknown,
  disbursedAmount?: unknown,
): boolean {
  return (
    ["partially_disbursed", "fully_disbursed", "disbursed"].includes(
      normalizeReportValue(value),
    ) ||
    normalizeReportValue(disbursementStatus).includes("disburs") ||
    toReportNumber(disbursedAmount) > 0
  );
}

export function toReportNumber(value: unknown): number {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

export function reportPercentage(part: number, total: number): number {
  return total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0;
}

export function getIstDateKey(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isSameIstDay(
  first: Date | string | null | undefined,
  second: Date | string | null | undefined,
): boolean {
  const firstKey = getIstDateKey(first);
  return Boolean(firstKey) && firstKey === getIstDateKey(second);
}

export function resolveStudentConversionDate(student: {
  createdAt: Date;
  lead: { convertedAt: Date | null };
}): Date {
  return student.lead.convertedAt ?? student.createdAt;
}

export function isSameDayApplication(student: {
  createdAt: Date;
  lead: { createdAt: Date; convertedAt: Date | null };
}): boolean {
  return isSameIstDay(
    student.lead.createdAt,
    student.lead.convertedAt ?? student.createdAt,
  );
}

export function isOldWalkInApplication(student: {
  createdAt: Date;
  lead: { createdAt: Date; convertedAt: Date | null };
}): boolean {
  return !isSameDayApplication(student);
}
