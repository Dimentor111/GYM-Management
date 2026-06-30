/** Date/time helpers. All dates are stored as ISO strings / `YYYY-MM-DD`. */

/** Full ISO timestamp, e.g. `2026-06-30T12:34:56.000Z`. */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Today as `YYYY-MM-DD`. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Current time as `HH:MM`. */
export function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

/** Format an ISO-ish date string as `DD.MM.YYYY`. Empty/undefined → em dash. */
export function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  if (!y || !m || !d) return '—';
  return `${d}.${m}.${y}`;
}

/** Add `days` to a `YYYY-MM-DD` date and return a `YYYY-MM-DD` string. */
export function addDays(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from today until the given date (negative if past). */
export function daysUntil(endDate: string): number {
  return (new Date(endDate).getTime() - new Date(todayISO()).getTime()) / 86_400_000;
}

/** Number of days in a given month. `month` is 1-12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
