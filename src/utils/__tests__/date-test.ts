import { describe, expect, it } from '@jest/globals';

import { formatDate, getWeekStart, isDateKeyInWeek, parseDateKey, toDateKey } from '@/utils/date';

describe('getWeekStart', () => {
  it('returns the Monday of the week', () => {
    expect(toDateKey(getWeekStart(new Date(2026, 9, 13, 15)))).toBe('2026-10-12'); // Tuesday
    expect(toDateKey(getWeekStart(new Date(2026, 9, 12, 0, 0)))).toBe('2026-10-12'); // Monday
    expect(toDateKey(getWeekStart(new Date(2026, 9, 18, 23, 59)))).toBe('2026-10-12'); // Sunday
  });
});

describe('date keys', () => {
  it('parses YYYY-MM-DD as a local date, not UTC midnight', () => {
    expect(toDateKey(parseDateKey('2026-09-28'))).toBe('2026-09-28');
    expect(formatDate('2026-09-28')).toBe('Mon, Sep 28');
  });

  it('checks whether a date is inside a Monday–Sunday week', () => {
    expect(isDateKeyInWeek('2026-10-12', '2026-10-12')).toBe(true);
    expect(isDateKeyInWeek('2026-10-18', '2026-10-12')).toBe(true);
    expect(isDateKeyInWeek('2026-10-19', '2026-10-12')).toBe(false);
    expect(isDateKeyInWeek('2026-10-11', '2026-10-12')).toBe(false);
  });
});
