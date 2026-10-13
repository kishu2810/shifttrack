import { clearShifts, readShifts, writeShifts } from '@/storage/shiftStorage';
import type { LoginCredentials, Session } from '@/types/auth';
import type { Shift } from '@/types/shift';
import { isDateKeyInWeek } from '@/utils/date';
import { getShiftConflict } from '@/utils/shiftOverlap';

import { ApiError, type ShiftTrackApi } from './types';

// Assessment-provided test account. This is mock data, not a real secret.
export const DEMO_CREDENTIALS: LoginCredentials = {
  email: 'staff@shifttrack.test',
  password: 'Password123',
};

const MOCK_ACCOUNT = {
  ...DEMO_CREDENTIALS,
  session: { token: 'abc123', user: { id: 'u1', name: 'Alex' } } satisfies Session,
};

const NETWORK_DELAY_MS = 700;

const mockSettings = { simulateErrors: false };

/** Makes every subsequent request fail with a 500, to demo error states. */
export function setSimulateErrors(enabled: boolean): void {
  mockSettings.simulateErrors = enabled;
}

export function getSimulateErrors(): boolean {
  return mockSettings.simulateErrors;
}

/** Wipes the mock database so the empty state can be demoed again. */
export async function resetMockData(): Promise<void> {
  await clearShifts();
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function simulateRequest(): Promise<void> {
  await wait(NETWORK_DELAY_MS);
  if (mockSettings.simulateErrors) {
    throw new ApiError('The server is unavailable. Please try again.', 500);
  }
}

const createId = () => `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const byStartTime = (a: Shift, b: Shift) => a.startTime.localeCompare(b.startTime);

function assertNoConflict(shift: Shift, shifts: Shift[]): void {
  const conflict = getShiftConflict(shift, shifts, { excludeId: shift.id });
  if (conflict) throw new ApiError(conflict, 409);
}

function assertValidTimes(shift: Shift): void {
  if (Number.isNaN(Date.parse(shift.startTime))) throw new ApiError('Invalid start time.', 400);
  if (shift.endTime === null) return;
  if (Number.isNaN(Date.parse(shift.endTime))) throw new ApiError('Invalid end time.', 400);
  if (Date.parse(shift.endTime) <= Date.parse(shift.startTime)) {
    throw new ApiError('End time must be after start time.', 400);
  }
}

export const mockApi: ShiftTrackApi = {
  async login({ email, password }) {
    await simulateRequest();
    if (email.trim().toLowerCase() !== MOCK_ACCOUNT.email || password !== MOCK_ACCOUNT.password) {
      throw new ApiError('Incorrect email or password.', 401);
    }
    return MOCK_ACCOUNT.session;
  },

  async getShifts(weekStart) {
    await simulateRequest();
    const shifts = await readShifts();
    return shifts
      .filter((shift) => shift.endTime === null || isDateKeyInWeek(shift.date, weekStart))
      .sort(byStartTime);
  },

  async createShift(input) {
    await simulateRequest();
    const shifts = await readShifts();
    if (input.breakMinutes < 0) throw new ApiError('Break minutes cannot be negative.', 400);
    const shift: Shift = { id: createId(), ...input };
    assertValidTimes(shift);
    assertNoConflict(shift, shifts);
    await writeShifts([...shifts, shift]);
    return shift;
  },

  async updateShift(id, changes) {
    await simulateRequest();
    const shifts = await readShifts();
    const existing = shifts.find((shift) => shift.id === id);
    if (!existing) throw new ApiError('Shift not found.', 404);

    const updated: Shift = { ...existing, ...changes, id };
    assertValidTimes(updated);
    // Ending the active shift (clocking out) is never blocked; every other change is checked.
    const isClockingOut = existing.endTime === null && updated.endTime !== null;
    if (!isClockingOut) assertNoConflict(updated, shifts);
    await writeShifts(shifts.map((shift) => (shift.id === id ? updated : shift)));
    return updated;
  },

  async deleteShift(id) {
    await simulateRequest();
    const shifts = await readShifts();
    const existing = shifts.find((shift) => shift.id === id);
    if (!existing) throw new ApiError('Shift not found.', 404);
    if (existing.endTime === null) throw new ApiError('End the active shift before deleting it.', 409);
    await writeShifts(shifts.filter((shift) => shift.id !== id));
  },
};
