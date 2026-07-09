import type { PerformancePeriodType } from "@/types/counsellor-performance";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

type DateParts = {
  year: number;
  month: number;
  day: number;
};

type PeriodRangeInput = {
  period: PerformancePeriodType;
  date: string;
  startDate?: string;
  endDate?: string;
};

export type ResolvedPeriodRange = {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  label: string;
};

function isValidYmd(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function parseYmd(value: string): DateParts {
  const [year, month, day] = value.split("-").map(Number);

  return {
    year,
    month,
    day,
  };
}

function toYmdFromUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDaysToYmd(value: string, days: number) {
  const { year, month, day } = parseYmd(value);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return toYmdFromUtcDate(date);
}

function getMonthStart(value: string) {
  const { year, month } = parseYmd(value);

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function getNextMonthStart(value: string) {
  const { year, month } = parseYmd(value);
  const date = new Date(Date.UTC(year, month, 1));

  return toYmdFromUtcDate(date);
}

function getWeekStartMonday(value: string) {
  const { year, month, day } = parseYmd(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay();
  const daysFromMonday = (dayOfWeek + 6) % 7;

  date.setUTCDate(date.getUTCDate() - daysFromMonday);

  return toYmdFromUtcDate(date);
}

function istDateStartToUtc(value: string) {
  const { year, month, day } = parseYmd(value);

  return new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);
}

function formatDateLabel(value: string) {
  const { year, month, day } = parseYmd(value);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonthLabel(value: string) {
  const { year, month } = parseYmd(value);
  const date = new Date(Date.UTC(year, month - 1, 1));

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getCurrentIstDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function resolvePerformancePeriodRange({
  period,
  date,
  startDate,
  endDate,
}: PeriodRangeInput): ResolvedPeriodRange {
  const safeDate = isValidYmd(date) ? date : getCurrentIstDate();

  let rangeStart: string;
  let rangeEndExclusive: string;
  let label: string;

  if (period === "custom") {
    const safeStart = isValidYmd(startDate) ? startDate : safeDate;
    const safeEnd = isValidYmd(endDate) ? endDate : safeStart;

    rangeStart = safeStart <= safeEnd ? safeStart : safeEnd;
    const inclusiveEnd = safeEnd >= safeStart ? safeEnd : safeStart;
    rangeEndExclusive = addDaysToYmd(inclusiveEnd, 1);

    label = `${formatDateLabel(rangeStart)} - ${formatDateLabel(inclusiveEnd)}`;
  } else if (period === "daily") {
    rangeStart = safeDate;
    rangeEndExclusive = addDaysToYmd(safeDate, 1);
    label = formatDateLabel(safeDate);
  } else if (period === "weekly") {
    rangeStart = getWeekStartMonday(safeDate);
    rangeEndExclusive = addDaysToYmd(rangeStart, 7);
    label = `${formatDateLabel(rangeStart)} - ${formatDateLabel(
      addDaysToYmd(rangeEndExclusive, -1),
    )}`;
  } else {
    rangeStart = getMonthStart(safeDate);
    rangeEndExclusive = getNextMonthStart(safeDate);
    label = formatMonthLabel(rangeStart);
  }

  return {
    start: istDateStartToUtc(rangeStart),
    end: istDateStartToUtc(rangeEndExclusive),
    startDate: rangeStart,
    endDate: addDaysToYmd(rangeEndExclusive, -1),
    label,
  };
}
