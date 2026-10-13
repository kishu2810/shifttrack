import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

import { Button } from './Button';

type StartShiftCardProps = {
  onStart: () => void;
  isStarting: boolean;
};

export function StartShiftCard({ onStart, isStarting }: StartShiftCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Not on shift</Text>
      <Text style={styles.detail}>Start a shift to begin tracking your time now.</Text>
      <Button title="Start Shift" onPress={onStart} loading={isStarting} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 4 },
  title: { fontSize: 20, fontWeight: '600', color: colors.text },
  detail: { fontSize: 15, color: colors.textSecondary },
  button: { marginTop: 12 },
});
