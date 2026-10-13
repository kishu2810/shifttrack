import type { LoginCredentials } from '@/types/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function validateLogin({ email, password }: LoginCredentials): FieldErrors<keyof LoginCredentials> {
  const errors: FieldErrors<keyof LoginCredentials> = {};
  if (!email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export type ShiftFormValues = {
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  breakMinutes: string;
};

export function validateShiftForm(values: ShiftFormValues): FieldErrors<keyof ShiftFormValues> {
  const errors: FieldErrors<keyof ShiftFormValues> = {};
  if (!values.date) errors.date = 'Date is required.';
  if (!values.startTime) errors.startTime = 'Start time is required.';
  if (!values.endTime) errors.endTime = 'End time is required.';

  const breakText = values.breakMinutes.trim();
  const breakMinutes = Number(breakText);
  if (breakText === '' || !Number.isInteger(breakMinutes) || breakMinutes < 0) {
    errors.breakMinutes = 'Break must be a whole number of minutes (0 or more).';
  }

  if (values.startTime && values.endTime) {
    const workedMinutes = Math.round((values.endTime.getTime() - values.startTime.getTime()) / 60_000);
    if (workedMinutes <= 0) {
      errors.endTime = 'End time must be after start time.';
    } else if (!errors.breakMinutes && breakMinutes >= workedMinutes) {
      errors.breakMinutes = 'Break must be shorter than the shift.';
    }
  }
  return errors;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;
