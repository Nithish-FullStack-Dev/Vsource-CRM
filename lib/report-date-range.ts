export type ReportDateRange = { gte: Date; lt: Date };

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);
  return Number.isNaN(result.getTime()) ? null : result;
}

export function addReportDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 86_400_000);
}

export function currentIstDayStart(now = new Date()): Date {
  const value = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parseYmd(value) ?? now;
}

function startOfWeek(value: Date): Date {
  const istCalendar = new Date(value.getTime() + IST_OFFSET_MS);
  const day = istCalendar.getUTCDay();
  return addReportDays(value, -((day + 6) % 7));
}

function startOfMonth(value: Date): Date {
  const shifted = new Date(value.getTime() + IST_OFFSET_MS);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1) - IST_OFFSET_MS,
  );
}

function addMonths(value: Date, months: number): Date {
  const shifted = new Date(value.getTime() + IST_OFFSET_MS);
  return new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + months, 1) -
      IST_OFFSET_MS,
  );
}

export function resolveReportDateRange(
  preset: string,
  startDate = "",
  endDate = "",
  now = new Date(),
): ReportDateRange | null {
  const today = currentIstDayStart(now);
  const tomorrow = addReportDays(today, 1);

  switch (preset) {
    case "today":
      return { gte: today, lt: tomorrow };
    case "yesterday":
      return { gte: addReportDays(today, -1), lt: today };
    case "last_7_days":
      return { gte: addReportDays(today, -6), lt: tomorrow };
    case "last_30_days":
      return { gte: addReportDays(today, -29), lt: tomorrow };
    case "this_week": {
      const start = startOfWeek(today);
      return { gte: start, lt: addReportDays(start, 7) };
    }
    case "last_week": {
      const end = startOfWeek(today);
      return { gte: addReportDays(end, -7), lt: end };
    }
    case "this_month": {
      const start = startOfMonth(today);
      return { gte: start, lt: addMonths(start, 1) };
    }
    case "last_month": {
      const end = startOfMonth(today);
      return { gte: addMonths(end, -1), lt: end };
    }
    case "this_quarter":
    case "last_quarter": {
      const shifted = new Date(today.getTime() + IST_OFFSET_MS);
      const currentQuarterMonth = Math.floor(shifted.getUTCMonth() / 3) * 3;
      const offset = preset === "last_quarter" ? -3 : 0;
      const start = new Date(
        Date.UTC(shifted.getUTCFullYear(), currentQuarterMonth + offset, 1) -
          IST_OFFSET_MS,
      );
      return { gte: start, lt: addMonths(start, 3) };
    }
    case "this_year": {
      const shifted = new Date(today.getTime() + IST_OFFSET_MS);
      const start = new Date(
        Date.UTC(shifted.getUTCFullYear(), 0, 1) - IST_OFFSET_MS,
      );
      return { gte: start, lt: addMonths(start, 12) };
    }
    case "custom": {
      const first = parseYmd(startDate);
      const second = parseYmd(endDate);
      if (!first && !second) return null;
      const start = first && second ? (first <= second ? first : second) : first ?? second!;
      const inclusiveEnd = first && second ? (first <= second ? second : first) : first ?? second!;
      return { gte: start, lt: addReportDays(inclusiveEnd, 1) };
    }
    default:
      return null;
  }
}

export function dateInReportRange(
  value: Date | null | undefined,
  range: ReportDateRange | null,
): boolean {
  if (!value) return false;
  return !range || (value >= range.gte && value < range.lt);
}

export function reportRangeLabel(range: ReportDateRange): string {
  const format = (value: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  return `${format(range.gte)} - ${format(addReportDays(range.lt, -1))}`;
}
