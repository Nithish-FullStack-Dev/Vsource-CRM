import type { PerformancePeriodType } from "@/types/counsellor-performance";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

type DateParts = { year: number; month: number; day: number };
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

const isValidYmd = (value: string | undefined): value is string =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

function parseYmd(value: string): DateParts {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

const toYmd = (date: Date) => date.toISOString().slice(0, 10);

function addDays(value: string, days: number) {
  const { year, month, day } = parseYmd(value);
  return toYmd(new Date(Date.UTC(year, month - 1, day + days)));
}

function monthStart(value: string) {
  const { year, month } = parseYmd(value);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function nextMonthStart(value: string) {
  const { year, month } = parseYmd(value);
  return toYmd(new Date(Date.UTC(year, month, 1)));
}

function weekStartMonday(value: string) {
  const { year, month, day } = parseYmd(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return toYmd(date);
}

function istStartToUtc(value: string) {
  const { year, month, day } = parseYmd(value);
  return new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS);
}

function formatDate(value: string) {
  const { year, month, day } = parseYmd(value);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatMonth(value: string) {
  const { year, month } = parseYmd(value);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
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
    const first = isValidYmd(startDate) ? startDate : safeDate;
    const second = isValidYmd(endDate) ? endDate : first;
    rangeStart = first <= second ? first : second;
    const inclusiveEnd = first <= second ? second : first;
    rangeEndExclusive = addDays(inclusiveEnd, 1);
    label = `${formatDate(rangeStart)} - ${formatDate(inclusiveEnd)}`;
  } else if (period === "daily") {
    rangeStart = safeDate;
    rangeEndExclusive = addDays(safeDate, 1);
    label = formatDate(safeDate);
  } else if (period === "weekly") {
    rangeStart = weekStartMonday(safeDate);
    rangeEndExclusive = addDays(rangeStart, 7);
    label = `${formatDate(rangeStart)} - ${formatDate(addDays(rangeEndExclusive, -1))}`;
  } else {
    rangeStart = monthStart(safeDate);
    rangeEndExclusive = nextMonthStart(safeDate);
    label = formatMonth(rangeStart);
  }

  return {
    start: istStartToUtc(rangeStart),
    end: istStartToUtc(rangeEndExclusive),
    startDate: rangeStart,
    endDate: addDays(rangeEndExclusive, -1),
    label,
  };
}
