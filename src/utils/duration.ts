import type { Shift } from '@/types/shift';

const MINUTE_MS = 60_000;

const pad = (value: number) => String(value).padStart(2, '0');

export function calculateElapsedTime(startTime: string, now: number = Date.now()): number {
  return Math.max(0, now - new Date(startTime).getTime());
}

/** Worked time: elapsed for an active shift, end − start − break for a completed one. */
export function calculateDuration(shift: Shift, now: number = Date.now()): number {
  if (shift.endTime === null) {
    return calculateElapsedTime(shift.startTime, now);
  }
  const grossMs = new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime();
  return Math.max(0, grossMs - shift.breakMinutes * MINUTE_MS);
}

/** "8h 00m" */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(Math.max(0, ms) / MINUTE_MS);
  return `${Math.floor(totalMinutes / 60)}h ${pad(totalMinutes % 60)}m`;
}

/** "04:27:09" */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${pad(hours)}:${pad(minutes)}:${pad(totalSeconds % 60)}`;
}
