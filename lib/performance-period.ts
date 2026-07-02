import type { PerformancePeriodType } from "@/types/counsellor-performance";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

function toCalendarDate(value: string): CalendarDate | null {
  const match = DATE_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function fromUtcCalendarDate(date: Date): CalendarDate {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  return fromUtcCalendarDate(
    new Date(Date.UTC(date.year, date.month - 1, date.day + days)),
  );
}

function toIstInstant(date: CalendarDate) {
  return new Date(
    Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0, 0) -
      IST_OFFSET_MS,
  );
}

function toDateInput(date: CalendarDate) {
  return [
    String(date.year).padStart(4, "0"),
    String(date.month).padStart(2, "0"),
    String(date.day).padStart(2, "0"),
  ].join("-");
}

function getMonthStart(date: CalendarDate): CalendarDate {
  return {
    year: date.year,
    month: date.month,
    day: 1,
  };
}

function getNextMonthStart(date: CalendarDate): CalendarDate {
  return fromUtcCalendarDate(new Date(Date.UTC(date.year, date.month, 1)));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getCurrentIstDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    const fallback = new Date(Date.now() + IST_OFFSET_MS);

    return [
      fallback.getUTCFullYear(),
      String(fallback.getUTCMonth() + 1).padStart(2, "0"),
      String(fallback.getUTCDate()).padStart(2, "0"),
    ].join("-");
  }

  return `${year}-${month}-${day}`;
}

export function getCurrentIstMonth() {
  const date = toCalendarDate(getCurrentIstDate());

  return {
    year: date?.year ?? new Date().getUTCFullYear(),
    month: date?.month ?? new Date().getUTCMonth() + 1,
  };
}

export function getIstMonthRange(year: number, month: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Invalid year");
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month");
  }

  const startDate: CalendarDate = { year, month, day: 1 };
  const endDate = getNextMonthStart(startDate);

  return {
    start: toIstInstant(startDate),
    end: toIstInstant(endDate),
    periodStart: toIstInstant(startDate),
  };
}

export function getPerformancePeriod(
  type: PerformancePeriodType,
  dateInput?: string,
) {
  const anchor = dateInput
    ? toCalendarDate(dateInput)
    : toCalendarDate(getCurrentIstDate());

  if (!anchor) {
    throw new Error("Invalid date");
  }

  let startDate: CalendarDate;
  let endDate: CalendarDate;

  if (type === "daily") {
    startDate = anchor;
    endDate = addCalendarDays(anchor, 1);
  } else if (type === "weekly") {
    const utcDay = new Date(
      Date.UTC(anchor.year, anchor.month - 1, anchor.day),
    ).getUTCDay();
    const daysFromMonday = (utcDay + 6) % 7;

    startDate = addCalendarDays(anchor, -daysFromMonday);
    endDate = addCalendarDays(startDate, 7);
  } else {
    startDate = getMonthStart(anchor);
    endDate = getNextMonthStart(anchor);
  }

  const start = toIstInstant(startDate);
  const end = toIstInstant(endDate);
  const inclusiveEnd = new Date(end.getTime() - 1);
  const targetPeriodStart = toIstInstant(getMonthStart(anchor));

  const label =
    type === "monthly"
      ? formatMonth(start)
      : type === "daily"
        ? formatDate(start)
        : `${formatDate(start)} - ${formatDate(inclusiveEnd)}`;

  return {
    type,
    date: toDateInput(anchor),
    year: anchor.year,
    month: anchor.month,
    start,
    end,
    label,
    targetPeriodStart,
  };
}
