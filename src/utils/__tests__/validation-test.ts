import { describe, expect, it } from '@jest/globals';

import { hasErrors, validateLogin, validateShiftForm, type ShiftFormValues } from '@/utils/validation';

const at = (hours: number, minutes = 0) => new Date(2026, 8, 28, hours, minutes);

const validShift: ShiftFormValues = {
  date: new Date(2026, 8, 28),
  startTime: at(9),
  endTime: at(17, 30),
  breakMinutes: '30',
};

describe('validateShiftForm', () => {
  it('accepts a valid shift', () => {
    expect(hasErrors(validateShiftForm(validShift))).toBe(false);
  });

  it('rejects an end time before the start time', () => {
    expect(validateShiftForm({ ...validShift, endTime: at(8) }).endTime).toBe('End time must be after start time.');
  });

  it('rejects an end time equal to the start time', () => {
    expect(validateShiftForm({ ...validShift, endTime: at(9) }).endTime).toBe('End time must be after start time.');
  });

  it('rejects a negative break', () => {
    expect(validateShiftForm({ ...validShift, breakMinutes: '-5' }).breakMinutes).toBeDefined();
  });

  it('rejects an empty or non-integer break', () => {
    expect(validateShiftForm({ ...validShift, breakMinutes: '' }).breakMinutes).toBeDefined();
    expect(validateShiftForm({ ...validShift, breakMinutes: '1.5' }).breakMinutes).toBeDefined();
  });

  it('accepts a zero-minute break', () => {
    expect(hasErrors(validateShiftForm({ ...validShift, breakMinutes: '0' }))).toBe(false);
  });

  it('rejects a break as long as the shift', () => {
    expect(validateShiftForm({ ...validShift, breakMinutes: '510' }).breakMinutes).toBe('Break must be shorter than the shift.');
  });

  it('requires date, start and end', () => {
    const errors = validateShiftForm({ date: null, startTime: null, endTime: null, breakMinutes: '0' });
    expect(Object.keys(errors).sort()).toEqual(['date', 'endTime', 'startTime']);
  });
});

describe('validateLogin', () => {
  it('requires a valid email and a password', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Email is required.',
      password: 'Password is required.',
    });
    expect(validateLogin({ email: 'not-an-email', password: 'x' }).email).toBe('Enter a valid email address.');
    expect(hasErrors(validateLogin({ email: 'staff@shifttrack.test', password: 'x' }))).toBe(false);
  });
});
