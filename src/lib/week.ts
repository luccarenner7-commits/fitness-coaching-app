/** Helpers for the "Woche N (DD.MM.-DD.MM.YY)" folder naming scheme.
 *  All date math is done in UTC so that ISO strings round-trip without the
 *  local-timezone off-by-one that `new Date(iso).toISOString()` causes. */

export const WEEKDAYS = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/**
 * Parse "YYYY-MM-DD" into a UTC Date at midnight. Falls back to today rather
 * than producing an Invalid Date — a malformed string reaching the formatters
 * below (e.g. from unexpected sheet content) would otherwise throw inside
 * Intl.DateTimeFormat and take the whole page down with it.
 */
function parseIso(iso: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return new Date(Date.UTC(1970, 0, 1));
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Today's date as "YYYY-MM-DD" in the user's local calendar. */
export function todayIso(): string {
  const now = new Date();
  return toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** ISO date for `weekday` within a week that starts on `mondayIso`. */
export function dateForWeekday(mondayIso: string, weekday: string): string {
  const idx = WEEKDAYS.indexOf(weekday as Weekday);
  const d = parseIso(mondayIso);
  d.setUTCDate(d.getUTCDate() + (idx < 0 ? 0 : idx));
  return toIso(d);
}

export function isTodayIso(iso: string): boolean {
  return iso === todayIso();
}

/** Weekday label for today ("Montag" … "Sonntag"). */
export function currentWeekdayLabel(): Weekday {
  const js = new Date().getDay(); // 0 = Sunday
  return WEEKDAYS[(js + 6) % 7];
}

const DE_DATE = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});
const DE_DATE_LONG = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

export function formatShortDate(iso: string): string {
  return DE_DATE.format(parseIso(iso));
}

export function formatLongDate(iso: string): string {
  return DE_DATE_LONG.format(parseIso(iso));
}

export function formatWeekRange(startIso: string, endIso: string): string {
  // formatShortDate already yields a trailing dot in de-DE ("31.08.").
  return `${formatShortDate(startIso)}–${formatShortDate(endIso)}`;
}
