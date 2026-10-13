const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, '0');

/** Formats a Date as a local-calendar YYYY-MM-DD key. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Parses a YYYY-MM-DD key as local midnight.
 * `new Date('2026-09-28')` would be UTC midnight and can land on the previous day.
 */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Monday 00:00 (local) of the week containing `date`. */
export function getWeekStart(date: Date = new Date()): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isDateKeyInWeek(dateKey: string, weekStartKey: string): boolean {
  const weekEndKey = toDateKey(addDays(parseDateKey(weekStartKey), 6));
  return dateKey >= weekStartKey && dateKey <= weekEndKey;
}

/** "09:00" */
export function formatTime(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "Mon, Sep 28" */
export function formatDate(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** "Today", "Yesterday" or "Mon, Sep 28" */
export function formatRelativeDate(dateKey: string, now: Date = new Date()): string {
  const diffDays = Math.round((parseDateKey(toDateKey(now)).getTime() - parseDateKey(dateKey).getTime()) / DAY_MS);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return formatDate(dateKey);
}

/** "Oct 12 – Oct 18" */
export function formatWeekRange(weekStart: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const end = addDays(weekStart, 6);
  return `${weekStart.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}`;
}

/** Combines the calendar day of `day` with the hours/minutes of `time`. */
export function combineDateAndTime(day: Date, time: Date): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes(), 0, 0);
}
