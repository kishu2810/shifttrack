export type Shift = {
  id: string;
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  /** ISO 8601 timestamp */
  startTime: string;
  /** ISO 8601 timestamp; null while the shift is active */
  endTime: string | null;
  breakMinutes: number;
};

export type CreateShiftInput = Omit<Shift, 'id'>;

export type UpdateShiftInput = Partial<Omit<Shift, 'id'>>;
