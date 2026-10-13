import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import type { Shift } from '@/types/shift';
import { formatRelativeDate, formatTime } from '@/utils/date';
import { formatElapsed } from '@/utils/duration';

import { Button } from './Button';

type ActiveShiftCardProps = {
  shift: Shift;
  onEnd: () => void;
  isEnding: boolean;
};

export function ActiveShiftCard({ shift, onEnd, isEnding }: ActiveShiftCardProps) {
  const elapsedMs = useElapsedTime(shift.startTime);

  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <View style={styles.dot} />
        <Text style={styles.status}>On shift</Text>
      </View>
      <Text style={styles.timer} accessibilityLabel={`Elapsed ${formatElapsed(elapsedMs)}`}>
        {formatElapsed(elapsedMs)}
      </Text>
      <Text style={styles.detail}>
        Started {formatRelativeDate(shift.date)} at {formatTime(shift.startTime)} · Break: {shift.breakMinutes} min
      </Text>
      <Button title="End Shift" variant="danger" onPress={onEnd} loading={isEnding} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 6, borderWidth: 1.5, borderColor: colors.success },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  status: { fontSize: 15, fontWeight: '600', color: colors.success, textTransform: 'uppercase', letterSpacing: 0.5 },
  timer: { fontSize: 48, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  detail: { fontSize: 15, color: colors.textSecondary },
  button: { marginTop: 12 },
});
