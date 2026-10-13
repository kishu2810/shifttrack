import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { formatDate, formatTime, toDateKey } from '@/utils/date';

type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: Date;
  onChange: (value: Date) => void;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DateTimeField({ label, mode, value, onChange, error, minimumDate, maximumDate }: DateTimeFieldProps) {
  const displayValue = mode === 'date' ? formatDate(toDateKey(value)) : formatTime(value);

  const openAndroidPicker = () =>
    DateTimePickerAndroid.open({
      value,
      mode,
      is24Hour: true,
      minimumDate,
      maximumDate,
      onValueChange: (_event, date) => onChange(date),
    });

  return (
    <View style={styles.container}>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <Text style={styles.label}>{label}</Text>
        {Platform.OS === 'ios' ? (
          <DateTimePicker
            value={value}
            mode={mode}
            display="compact"
            locale={mode === 'time' ? 'en-GB' : undefined}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            accentColor={colors.primary}
            onValueChange={(_event, date) => onChange(date)}
            accessibilityLabel={label}
          />
        ) : (
          <Pressable
            onPress={openAndroidPicker}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${displayValue}`}
            style={styles.androidValue}
          >
            <Text style={styles.valueText}>{displayValue}</Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  rowError: { borderColor: colors.danger },
  label: { fontSize: 17, color: colors.text },
  androidValue: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.background },
  valueText: { fontSize: 17, color: colors.primary, fontWeight: '500' },
  error: { fontSize: 14, color: colors.danger },
});
