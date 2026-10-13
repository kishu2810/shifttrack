import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={[styles.line, { width: '35%' }]} />
          <View style={[styles.line, { width: '60%' }]} />
          <View style={[styles.line, { width: '45%' }]} />
        </View>
      ))}
      <View style={styles.footer}>
        <ActivityIndicator color={colors.textSecondary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  skeletonCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 10 },
  line: { height: 12, borderRadius: 6, backgroundColor: colors.skeleton },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 8 },
  message: { fontSize: 15, color: colors.textSecondary },
});
