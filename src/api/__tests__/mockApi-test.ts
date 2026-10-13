import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { mockApi, resetMockData, setSimulateErrors } from '@/api/mockApi';
import type { CreateShiftInput } from '@/types/shift';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

/** Runs a mock request to completion by skipping its simulated network delay. */
async function settle<T>(request: Promise<T>): Promise<T> {
  const outcome = request.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await jest.advanceTimersByTimeAsync(1_000);
  const result = await outcome;
  if (!result.ok) throw result.error;
  return result.value;
}

const completed: CreateShiftInput = {
  date: '2026-10-13',
  startTime: '2026-10-13T09:00:00.000Z',
  endTime: '2026-10-13T17:00:00.000Z',
  breakMinutes: 30,
};
const active: CreateShiftInput = { ...completed, startTime: '2026-10-13T18:00:00.000Z', endTime: null, breakMinutes: 0 };

describe('mockApi', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-13T08:00:00.000Z'));
    setSimulateErrors(false);
    await resetMockData();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects wrong credentials and accepts the test account', async () => {
    await expect(settle(mockApi.login({ email: 'staff@shifttrack.test', password: 'wrong' }))).rejects.toMatchObject({ status: 401 });
    await expect(settle(mockApi.login({ email: 'staff@shifttrack.test', password: 'Password123' }))).resolves.toMatchObject({
      token: 'abc123',
      user: { id: 'u1', name: 'Alex' },
    });
  });

  it('allows only one active shift', async () => {
    await settle(mockApi.createShift(active));
    await expect(settle(mockApi.createShift(active))).rejects.toMatchObject({ status: 409 });
  });

  it('rejects overlapping shifts on create and edit, but not an edit of the same shift', async () => {
    const created = await settle(mockApi.createShift(completed));
    await expect(
      settle(mockApi.createShift({ ...completed, startTime: '2026-10-13T12:00:00.000Z', endTime: '2026-10-13T20:00:00.000Z' })),
    ).rejects.toMatchObject({ status: 409, message: 'This shift overlaps with an existing shift.' });

    const evening = await settle(
      mockApi.createShift({ ...completed, startTime: '2026-10-13T17:00:00.000Z', endTime: '2026-10-13T21:00:00.000Z' }),
    );
    await expect(settle(mockApi.updateShift(created.id, { startTime: '2026-10-13T08:00:00.000Z' }))).resolves.toBeDefined();
    await expect(settle(mockApi.updateShift(evening.id, { startTime: '2026-10-13T16:00:00.000Z' }))).rejects.toMatchObject({
      status: 409,
    });
  });

  it('rejects starting a shift while another shift covers the current time', async () => {
    jest.setSystemTime(new Date('2026-10-13T12:00:00.000Z'));
    await settle(mockApi.createShift(completed));
    await expect(settle(mockApi.createShift({ ...active, startTime: new Date().toISOString() }))).rejects.toMatchObject({
      status: 409,
    });
  });

  it('always allows clocking out of the active shift', async () => {
    jest.setSystemTime(new Date('2026-10-13T08:00:00.000Z'));
    const running = await settle(mockApi.createShift({ ...active, startTime: '2026-10-13T08:00:00.000Z' }));
    await settle(mockApi.createShift({ ...completed, startTime: '2026-10-13T09:00:00.000Z', endTime: '2026-10-13T10:00:00.000Z' }));
    await expect(settle(mockApi.updateShift(running.id, { endTime: '2026-10-13T11:00:00.000Z' }))).resolves.toMatchObject({
      endTime: '2026-10-13T11:00:00.000Z',
    });
  });

  it('rejects an end time before the start time', async () => {
    await expect(settle(mockApi.createShift({ ...completed, endTime: '2026-10-13T08:00:00.000Z' }))).rejects.toMatchObject({
      status: 400,
    });
  });

  it('returns the week’s shifts plus the active shift from any week', async () => {
    jest.setSystemTime(new Date('2026-10-12T02:00:00.000Z'));
    await settle(mockApi.createShift(completed));
    await settle(mockApi.createShift({ ...completed, date: '2026-10-05', startTime: '2026-10-05T09:00:00.000Z', endTime: '2026-10-05T17:00:00.000Z' }));
    // Started Sunday night of the previous week and still running.
    await settle(mockApi.createShift({ ...active, date: '2026-10-11', startTime: '2026-10-11T22:00:00.000Z' }));

    const shifts = await settle(mockApi.getShifts('2026-10-12'));
    expect(shifts.map((shift) => shift.date)).toEqual(['2026-10-11', '2026-10-13']);
  });

  it('updates a shift with PATCH', async () => {
    const created = await settle(mockApi.createShift(completed));
    const updated = await settle(mockApi.updateShift(created.id, { breakMinutes: 45 }));
    expect(updated).toEqual({ ...created, breakMinutes: 45 });
  });

  it('deletes completed shifts but not the active shift', async () => {
    const done = await settle(mockApi.createShift(completed));
    const running = await settle(mockApi.createShift(active));

    await expect(settle(mockApi.deleteShift(running.id))).rejects.toMatchObject({ status: 409 });
    await settle(mockApi.deleteShift(done.id));

    const remaining = await settle(mockApi.getShifts('2026-10-12'));
    expect(remaining.map((shift) => shift.id)).toEqual([running.id]);
    await expect(settle(mockApi.deleteShift(done.id))).rejects.toMatchObject({ status: 404 });
  });

  it('fails every request while simulated errors are on', async () => {
    setSimulateErrors(true);
    await expect(settle(mockApi.getShifts('2026-10-12'))).rejects.toMatchObject({ status: 500 });
  });
});
