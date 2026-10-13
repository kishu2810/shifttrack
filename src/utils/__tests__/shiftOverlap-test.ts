import { describe, expect, it } from '@jest/globals';

import type { Shift } from '@/types/shift';
import {
  ACTIVE_SHIFT_EXISTS_MESSAGE,
  getShiftConflict,
  SHIFT_OVERLAP_MESSAGE,
  START_OVERLAP_MESSAGE,
} from '@/utils/shiftOverlap';

const iso = (time: string) => `2026-10-13T${time}:00.000Z`;

const shift = (id: string, start: string, end: string | null): Shift => ({
  id,
  date: '2026-10-13',
  startTime: iso(start),
  endTime: end === null ? null : iso(end),
  breakMinutes: 0,
});

const dayShift = shift('existing', '09:00', '17:00');
const candidate = (start: string, end: string) => ({ startTime: iso(start), endTime: iso(end) });
const startingAt = (time: string) => ({ startTime: iso(time), endTime: null });

describe('getShiftConflict — creating a shift', () => {
  it('rejects an exact duplicate', () => {
    expect(getShiftConflict(candidate('09:00', '17:00'), [dayShift])).toBe(SHIFT_OVERLAP_MESSAGE);
  });

  it('rejects a partial overlap at either end', () => {
    expect(getShiftConflict(candidate('08:00', '10:00'), [dayShift])).toBe(SHIFT_OVERLAP_MESSAGE);
    expect(getShiftConflict(candidate('16:00', '18:00'), [dayShift])).toBe(SHIFT_OVERLAP_MESSAGE);
  });

  it('rejects a new shift inside an existing shift', () => {
    expect(getShiftConflict(candidate('10:00', '12:00'), [dayShift])).toBe(SHIFT_OVERLAP_MESSAGE);
  });

  it('rejects a new shift that contains an existing shift', () => {
    expect(getShiftConflict(candidate('08:00', '18:00'), [dayShift])).toBe(SHIFT_OVERLAP_MESSAGE);
  });

  it('rejects a shift with the same start but a different end', () => {
    expect(getShiftConflict(candidate('09:00', '12:00'), [dayShift])).toBe(SHIFT_OVERLAP_MESSAGE);
  });

  it('allows adjacent shifts on either side', () => {
    expect(getShiftConflict(candidate('17:00', '21:00'), [dayShift])).toBeNull();
    expect(getShiftConflict(candidate('06:00', '09:00'), [dayShift])).toBeNull();
  });

  it('allows a shift on another day at the same times', () => {
    const nextDay = { startTime: '2026-10-14T09:00:00.000Z', endTime: '2026-10-14T17:00:00.000Z' };
    expect(getShiftConflict(nextDay, [dayShift])).toBeNull();
  });

  it('rejects a shift overlapping the time an active shift has already run', () => {
    const active = shift('active', '09:00', null);
    const now = Date.parse(iso('12:00'));
    expect(getShiftConflict(candidate('10:00', '11:00'), [active], { now })).toBe(SHIFT_OVERLAP_MESSAGE);
    expect(getShiftConflict(candidate('13:00', '14:00'), [active], { now })).toBeNull();
  });
});

describe('getShiftConflict — editing a shift', () => {
  it('does not conflict with the shift being edited', () => {
    expect(getShiftConflict(candidate('09:00', '17:00'), [dayShift], { excludeId: 'existing' })).toBeNull();
    expect(getShiftConflict(candidate('10:00', '18:00'), [dayShift], { excludeId: 'existing' })).toBeNull();
  });

  it('still conflicts with other shifts', () => {
    const evening = shift('evening', '17:00', '21:00');
    expect(getShiftConflict(candidate('10:00', '18:00'), [dayShift, evening], { excludeId: 'existing' })).toBe(
      SHIFT_OVERLAP_MESSAGE,
    );
  });
});

describe('getShiftConflict — starting a shift', () => {
  it('rejects starting while another shift covers the current time', () => {
    expect(getShiftConflict(startingAt('12:00'), [dayShift], { now: Date.parse(iso('12:00')) })).toBe(START_OVERLAP_MESSAGE);
  });

  it('rejects starting at the exact moment another shift begins', () => {
    expect(getShiftConflict(startingAt('09:00'), [dayShift], { now: Date.parse(iso('09:00')) })).toBe(START_OVERLAP_MESSAGE);
  });

  it('allows starting right when the previous shift ends, or before a later shift', () => {
    expect(getShiftConflict(startingAt('17:00'), [dayShift], { now: Date.parse(iso('17:00')) })).toBeNull();
    expect(getShiftConflict(startingAt('07:00'), [dayShift], { now: Date.parse(iso('07:00')) })).toBeNull();
  });

  it('rejects starting when another active shift already exists', () => {
    const active = shift('active', '06:00', null);
    expect(getShiftConflict(startingAt('20:00'), [active], { now: Date.parse(iso('20:00')) })).toBe(ACTIVE_SHIFT_EXISTS_MESSAGE);
  });
});
