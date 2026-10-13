import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { formatWeekRange } from '@/utils/date';

type WeekNavigatorProps = {
  weekStart: Date;
  weekOffset: number;
  onChange: (weekOffset: number) => void;
};

function getWeekTitle(weekOffset: number): string {
  if (weekOffset === 0) return 'This Week';
  if (weekOffset === -1) return 'Last Week';
  if (weekOffset === 1) return 'Next Week';
  return weekOffset < 0 ? `${-weekOffset} Weeks Ago` : `In ${weekOffset} Weeks`;
}

export function WeekNavigator({ weekStart, weekOffset, onChange }: WeekNavigatorProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange(weekOffset - 1)}
        accessibilityRole="button"
        accessibilityLabel="Previous week"
        style={styles.arrow}
      >
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>

      <Pressable
        onPress={() => onChange(0)}
        disabled={weekOffset === 0}
        accessibilityRole="button"
        accessibilityLabel={`${getWeekTitle(weekOffset)}, ${formatWeekRange(weekStart)}`}
        accessibilityHint={weekOffset === 0 ? undefined : 'Returns to the current week'}
        style={styles.center}
      >
        <Text style={styles.title} accessibilityRole="header">
          {getWeekTitle(weekOffset)}
        </Text>
        <Text style={styles.range}>{formatWeekRange(weekStart)}</Text>
        {weekOffset !== 0 ? <Text style={styles.today}>Back to this week</Text> : null}
      </Pressable>

      <Pressable onPress={() => onChange(weekOffset + 1)} accessibilityRole="button" accessibilityLabel="Next week" style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 6 },
  arrow: { width: 52, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 32, lineHeight: 36, color: colors.primary },
  center: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  range: { fontSize: 15, color: colors.textSecondary, marginTop: 2 },
  today: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: 4 },
});
