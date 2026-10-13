import { router } from 'expo-router';
import { useState } from 'react';

import { ShiftForm, type ShiftFormInitialValues } from '@/components/ShiftForm';
import { useShifts } from '@/context/ShiftsContext';
import type { CreateShiftInput } from '@/types/shift';
import { getWeekStart, toDateKey } from '@/utils/date';

const atTime = (day: Date, hours: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, 0, 0, 0);

/** Defaults to today when viewing the current week, otherwise to the selected week's Monday. */
function getInitialValues(weekStart: Date): ShiftFormInitialValues {
  const today = new Date();
  const isTodayInWeek = toDateKey(getWeekStart(today)) === toDateKey(weekStart);
  const day = isTodayInWeek ? today : weekStart;
  return { date: day, startTime: atTime(day, 9), endTime: atTime(day, 17), breakMinutes: 30 };
}

export default function CreateShiftScreen() {
  const { createShift, weekStart } = useShifts();
  const [initialValues] = useState(() => getInitialValues(weekStart));

  const handleSubmit = async (input: CreateShiftInput) => {
    await createShift(input);
    router.back();
  };

  return <ShiftForm initialValues={initialValues} submitLabel="Save Shift" onSubmit={handleSubmit} />;
}
