import type { LoginCredentials, Session } from '@/types/auth';
import type { CreateShiftInput, Shift, UpdateShiftInput } from '@/types/shift';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Contract the UI depends on. A real HTTP client only needs to implement this. */
export type ShiftTrackApi = {
  /** POST /auth/login */
  login(credentials: LoginCredentials): Promise<Session>;
  /** GET /shifts?weekStart=YYYY-MM-DD — the week's shifts plus any active shift */
  getShifts(weekStart: string): Promise<Shift[]>;
  /** POST /shifts */
  createShift(input: CreateShiftInput): Promise<Shift>;
  /** PATCH /shifts/:id */
  updateShift(id: string, changes: UpdateShiftInput): Promise<Shift>;
  /** DELETE /shifts/:id */
  deleteShift(id: string): Promise<void>;
};

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return error instanceof ApiError ? error.message : fallback;
}
