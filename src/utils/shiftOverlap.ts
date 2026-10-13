import type { Shift } from '@/types/shift';

export type ShiftTimes = Pick<Shift, 'startTime' | 'endTime'>;

export const SHIFT_OVERLAP_MESSAGE = 'This shift overlaps with an existing shift.';
export const START_OVERLAP_MESSAGE = 'You can’t start a shift now because it overlaps with an existing shift.';
export const ACTIVE_SHIFT_EXISTS_MESSAGE = 'You already have an active shift.';

type Interval = { start: number; end: number };

/**
 * An active shift covers the time it has actually run so far: [start, now].
 * Treating it as open-ended would block scheduling any later shift while on the clock.
 */
function toInterval(shift: ShiftTimes, now: number): Interval {
  const start = Date.parse(shift.startTime);
  const end = shift.endTime === null ? Math.max(now, start) : Date.parse(shift.endTime);
  return { start, end };
}

/**
 * Half-open ranges, so back-to-back shifts (09:00–17:00, 17:00–21:00) are allowed.
 * Equal starts always conflict, which also covers a zero-length "start now" check at the
 * exact moment another shift begins.
 */
export function shiftsOverlap(a: ShiftTimes, b: ShiftTimes, now: number = Date.now()): boolean {
  const first = toInterval(a, now);
  const second = toInterval(b, now);
  return first.start === second.start || (first.start < second.end && second.start < first.end);
}

type ConflictOptions = {
  /** The shift being edited, which must not conflict with itself. */
  excludeId?: string;
  now?: number;
};

export function findOverlappingShift(candidate: ShiftTimes, shifts: Shift[], { excludeId, now = Date.now() }: ConflictOptions = {}) {
  return shifts.find((shift) => shift.id !== excludeId && shiftsOverlap(candidate, shift, now)) ?? null;
}

/**
 * Single validation used by Create, Edit and Start Shift (client and mock API).
 * A candidate with `endTime: null` is a shift being started now.
 * Returns a user-facing message, or null when the shift is allowed.
 */
export function getShiftConflict(candidate: ShiftTimes, shifts: Shift[], options: ConflictOptions = {}): string | null {
  const isStarting = candidate.endTime === null;
  if (isStarting && shifts.some((shift) => shift.id !== options.excludeId && shift.endTime === null)) {
    return ACTIVE_SHIFT_EXISTS_MESSAGE;
  }
  if (findOverlappingShift(candidate, shifts, options)) {
    return isStarting ? START_OVERLAP_MESSAGE : SHIFT_OVERLAP_MESSAGE;
  }
  return null;
}
