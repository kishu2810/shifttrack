import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { colors } from '@/constants/colors';
import type { CreateShiftInput } from '@/types/shift';
import { addDays, combineDateAndTime, getWeekStart, toDateKey } from '@/utils/date';
import { calculateDuration, formatDuration } from '@/utils/duration';
import { hasErrors, validateShiftForm, type FieldErrors, type ShiftFormValues } from '@/utils/validation';

import { Button } from './Button';
import { DateTimeField } from './DateTimeField';
import { Input } from './Input';

export type ShiftFormInitialValues = {
  date: Date;
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
};

type ShiftFormProps = {
  initialValues: ShiftFormInitialValues;
  submitLabel: string;
  /** Should navigate away on success; a rejection is shown as an error under the form. */
  onSubmit: (input: CreateShiftInput) => Promise<void>;
};

/** Shared by Add Shift and Edit Shift. Dates are limited to the week of the initial date. */
export function ShiftForm({ initialValues, submitLabel, onSubmit }: ShiftFormProps) {
  const [weekStart] = useState(() => getWeekStart(initialValues.date));
  const weekEnd = new Date(addDays(weekStart, 7).getTime() - 1);

  const [date, setDate] = useState(initialValues.date);
  const [startTime, setStartTime] = useState(initialValues.startTime);
  const [endTime, setEndTime] = useState(initialValues.endTime);
  const [breakMinutes, setBreakMinutes] = useState(String(initialValues.breakMinutes));
  const [errors, setErrors] = useState<FieldErrors<keyof ShiftFormValues>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);

  const shiftStart = combineDateAndTime(date, startTime);
  const shiftEnd = combineDateAndTime(date, endTime);
  const parsedBreak = Number(breakMinutes);
  const previewMs =
    shiftEnd > shiftStart && Number.isInteger(parsedBreak) && parsedBreak >= 0
      ? calculateDuration({
          id: 'preview',
          date: toDateKey(date),
          startTime: shiftStart.toISOString(),
          endTime: shiftEnd.toISOString(),
          breakMinutes: parsedBreak,
        })
      : null;

  const clearError = (field: keyof ShiftFormValues) => setErrors(({ [field]: _removed, ...rest }) => rest);

  const handleSubmit = async () => {
    if (submitting.current) return;
    const validationErrors = validateShiftForm({ date, startTime: shiftStart, endTime: shiftEnd, breakMinutes });
    setErrors(validationErrors);
    setSubmitError(null);
    if (hasErrors(validationErrors)) return;

    submitting.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit({
        date: toDateKey(date),
        startTime: shiftStart.toISOString(),
        endTime: shiftEnd.toISOString(),
        breakMinutes: parsedBreak,
      });
      // Leave the guard set: the screen is closing and must not submit again.
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <DateTimeField
          label="Date"
          mode="date"
          value={date}
          minimumDate={weekStart}
          maximumDate={weekEnd}
          error={errors.date}
          onChange={(value) => {
            setDate(value);
            clearError('date');
          }}
        />
        <DateTimeField
          label="Start time"
          mode="time"
          value={startTime}
          error={errors.startTime}
          onChange={(value) => {
            setStartTime(value);
            clearError('startTime');
            clearError('endTime');
          }}
        />
        <DateTimeField
          label="End time"
          mode="time"
          value={endTime}
          error={errors.endTime}
          onChange={(value) => {
            setEndTime(value);
            clearError('endTime');
          }}
        />
        <Input
          label="Break (minutes)"
          value={breakMinutes}
          onChangeText={(text) => {
            setBreakMinutes(text.replace(/[^0-9]/g, ''));
            clearError('breakMinutes');
          }}
          error={errors.breakMinutes}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={3}
          placeholder="0"
        />

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total worked</Text>
          <Text style={styles.summaryValue}>{previewMs === null ? '—' : formatDuration(previewMs)}</Text>
        </View>

        {submitError ? (
          <View style={styles.submitError} accessibilityRole="alert">
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        ) : null}

        <Button title={submitLabel} onPress={handleSubmit} loading={isSubmitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  summaryLabel: { fontSize: 15, color: colors.textSecondary },
  summaryValue: { fontSize: 17, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  submitError: { backgroundColor: colors.dangerMuted, borderRadius: 12, padding: 12 },
  submitErrorText: { fontSize: 15, color: colors.danger },
});
