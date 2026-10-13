import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import type { Shift } from '@/types/shift';
import { formatRelativeDate, formatTime } from '@/utils/date';
import { calculateDuration, formatDuration } from '@/utils/duration';

function LiveElapsed({ startTime }: { startTime: string }) {
  return <Text style={styles.metaValue}>{formatDuration(useElapsedTime(startTime, 30_000))}</Text>;
}

type ShiftCardProps = {
  shift: Shift;
  /** Edit/Delete are only offered for completed shifts. */
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
};

export function ShiftCard({ shift, onEdit, onDelete, isDeleting = false }: ShiftCardProps) {
  const isActive = shift.endTime === null;
  const showActions = !isActive && (onEdit || onDelete);

  return (
    <View style={[styles.card, isActive && styles.activeCard]}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatRelativeDate(shift.date)}</Text>
        {isActive ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Active</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.times}>
        {formatTime(shift.startTime)} → {shift.endTime ? formatTime(shift.endTime) : 'Active'}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>
          Break: <Text style={styles.metaValue}>{shift.breakMinutes} min</Text>
        </Text>
        <Text style={styles.metaLabel}>
          {isActive ? 'Elapsed: ' : 'Total: '}
          {isActive ? <LiveElapsed startTime={shift.startTime} /> : <Text style={styles.metaValue}>{formatDuration(calculateDuration(shift))}</Text>}
        </Text>
      </View>
      {showActions ? (
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable onPress={onEdit} disabled={isDeleting} accessibilityRole="button" accessibilityLabel="Edit shift" style={styles.action}>
              <Text style={[styles.actionText, isDeleting && styles.actionDisabled]}>Edit</Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              disabled={isDeleting}
              accessibilityRole="button"
              accessibilityLabel="Delete shift"
              accessibilityState={{ busy: isDeleting, disabled: isDeleting }}
              style={styles.action}
            >
              {isDeleting ? <ActivityIndicator color={colors.danger} /> : <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>}
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 6 },
  activeCard: { borderWidth: 1.5, borderColor: colors.success },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 17, fontWeight: '600', color: colors.text },
  badge: { backgroundColor: colors.successMuted, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 13, fontWeight: '600', color: colors.success },
  times: { fontSize: 22, fontWeight: '500', color: colors.text, fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 15, color: colors.textSecondary },
  metaValue: { color: colors.text, fontWeight: '500', fontVariant: ['tabular-nums'] },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  action: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  actionText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  deleteText: { color: colors.danger },
  actionDisabled: { opacity: 0.5 },
});
