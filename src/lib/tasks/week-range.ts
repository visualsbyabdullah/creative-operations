const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function asDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function currentMonday(timeZone = "Asia/Karachi"): string {
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return weekRange(localDate).startDate;
}

export function weekRange(requestedDate: string): {
  startDate: string;
  endDate: string;
} {
  if (!DATE_ONLY.test(requestedDate)) throw new Error("invalid_date");
  const date = new Date(`${requestedDate}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || asDateOnly(date) !== requestedDate) {
    throw new Error("invalid_date");
  }
  const weekday = date.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  date.setUTCDate(date.getUTCDate() + mondayOffset);
  const startDate = asDateOnly(date);
  date.setUTCDate(date.getUTCDate() + 6);
  return { startDate, endDate: asDateOnly(date) };
}
