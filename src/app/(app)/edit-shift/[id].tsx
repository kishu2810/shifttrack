import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { ShiftForm, type ShiftFormInitialValues } from '@/components/ShiftForm';
import { useShifts } from '@/context/ShiftsContext';
import type { CreateShiftInput, Shift } from '@/types/shift';
import { parseDateKey } from '@/utils/date';

function toInitialValues(shift: Shift, endTime: string): ShiftFormInitialValues {
  return {
    date: parseDateKey(shift.date),
    startTime: new Date(shift.startTime),
    endTime: new Date(endTime),
    breakMinutes: shift.breakMinutes,
  };
}

export default function EditShiftScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shifts, updateShift } = useShifts();
  const shift = shifts.find((item) => item.id === id) ?? null;

  if (!shift || shift.endTime === null) {
    return (
      <View style={styles.container}>
        <EmptyState
          title={shift ? 'Shift is still active' : 'Shift not found'}
          message={shift ? 'End the active shift before editing it.' : 'This shift may have been deleted.'}
          actionLabel="Back to Shifts"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const handleSubmit = async (input: CreateShiftInput) => {
    await updateShift(shift.id, input);
    router.back();
  };

  return (
    // ShiftForm only reads initialValues on mount, so background refreshes never reset user edits.
    <ShiftForm
      key={shift.id}
      initialValues={toInitialValues(shift, shift.endTime)}
      submitLabel="Save Changes"
      onSubmit={handleSubmit}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
});
