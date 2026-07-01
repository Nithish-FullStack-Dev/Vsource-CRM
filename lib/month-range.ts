const IST_OFFSET_MS = 330 * 60 * 1000;

function validateMonth(year: number, month: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Invalid year");
  }

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month");
  }
}

export function getCurrentIstMonth() {
  const istNow = new Date(Date.now() + IST_OFFSET_MS);

  return {
    year: istNow.getUTCFullYear(),
    month: istNow.getUTCMonth() + 1,
  };
}

export function getIstMonthRange(year: number, month: number) {
  validateMonth(year, month);

  const periodStart = new Date(Date.UTC(year, month - 1, 1));

  const start = new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS);

  const end = new Date(Date.UTC(year, month, 1) - IST_OFFSET_MS);

  return {
    periodStart,
    start,
    end,
  };
}
