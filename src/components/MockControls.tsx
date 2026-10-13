import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { getSimulateErrors, resetMockData, setSimulateErrors } from '@/api/mockApi';
import { colors } from '@/constants/colors';

/** Demo-only controls for the in-app mock API. Rendered in development builds only. */
export function MockControls({ onDataReset }: { onDataReset: () => void }) {
  const [simulateErrors, setSimulateErrorsState] = useState(getSimulateErrors);

  const toggle = (enabled: boolean) => {
    setSimulateErrors(enabled);
    setSimulateErrorsState(enabled);
  };

  const reset = async () => {
    await resetMockData();
    onDataReset();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Mock API (dev only)</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Simulate API errors</Text>
        <Switch value={simulateErrors} onValueChange={toggle} accessibilityLabel="Simulate API errors" />
      </View>
      <Pressable onPress={reset} accessibilityRole="button" style={styles.row}>
        <Text style={styles.reset}>Reset demo data</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8 },
  heading: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', paddingVertical: 6 },
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, color: colors.text },
  reset: { fontSize: 16, color: colors.danger },
});
