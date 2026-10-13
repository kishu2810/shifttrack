import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { Shift } from '@/types/shift';
import { calculateDuration, calculateElapsedTime, formatDuration, formatElapsed } from '@/utils/duration';

const HOUR_MS = 60 * 60 * 1000;

const completedShift: Shift = {
  id: 's1',
  date: '2026-09-28',
  startTime: '2026-09-28T09:00:00.000Z',
  endTime: '2026-09-28T17:30:00.000Z',
  breakMinutes: 30,
};

describe('calculateDuration', () => {
  it('subtracts the break from a completed shift (09:00 → 17:30, 30 min break = 8h)', () => {
    expect(calculateDuration(completedShift)).toBe(8 * HOUR_MS);
    expect(formatDuration(calculateDuration(completedShift))).toBe('8h 00m');
  });

  it('never returns a negative duration', () => {
    expect(calculateDuration({ ...completedShift, breakMinutes: 600 })).toBe(0);
  });

  it('uses elapsed time for an active shift', () => {
    const now = Date.parse('2026-09-28T13:27:00.000Z');
    expect(calculateDuration({ ...completedShift, endTime: null }, now)).toBe(4 * HOUR_MS + 27 * 60_000);
  });
});

describe('calculateElapsedTime', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is Date.now() minus the start timestamp', () => {
    const startTime = '2026-09-28T09:00:00.000Z';
    const elapsedMs = 4 * HOUR_MS + 27 * 60_000 + 9_000;
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse(startTime) + elapsedMs);

    expect(calculateElapsedTime(startTime)).toBe(elapsedMs);
    expect(formatElapsed(calculateElapsedTime(startTime))).toBe('04:27:09');
  });

  it('jumps correctly after time passes without any ticks (e.g. app in background)', () => {
    const startTime = '2026-09-28T09:00:00.000Z';
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.parse(startTime) + 10_000);
    expect(calculateElapsedTime(startTime)).toBe(10_000);

    nowSpy.mockReturnValue(Date.parse(startTime) + 2 * HOUR_MS);
    expect(calculateElapsedTime(startTime)).toBe(2 * HOUR_MS);
  });

  it('clamps to zero if the clock is behind the start time', () => {
    expect(calculateElapsedTime('2026-09-28T09:00:00.000Z', Date.parse('2026-09-28T08:59:00.000Z'))).toBe(0);
  });
});

describe('formatting', () => {
  it('formats durations as hours and zero-padded minutes', () => {
    expect(formatDuration(7.5 * HOUR_MS)).toBe('7h 30m');
    expect(formatDuration(-1)).toBe('0h 00m');
  });
});
