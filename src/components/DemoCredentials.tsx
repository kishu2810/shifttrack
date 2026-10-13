import { StyleSheet, Text, View } from 'react-native';

import { DEMO_CREDENTIALS } from '@/api/mockApi';
import { colors } from '@/constants/colors';

import { Button } from './Button';

type DemoCredentialsProps = {
  onUse: (credentials: typeof DEMO_CREDENTIALS) => void;
  disabled?: boolean;
};

/** Shows the mock test account; long-press a value to copy it. */
export function DemoCredentials({ onUse, disabled = false }: DemoCredentialsProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Demo account</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value} selectable>
          {DEMO_CREDENTIALS.email}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Password</Text>
        <Text style={styles.value} selectable>
          {DEMO_CREDENTIALS.password}
        </Text>
      </View>
      <Button
        title="Use demo account"
        variant="secondary"
        onPress={() => onUse(DEMO_CREDENTIALS)}
        disabled={disabled}
        accessibilityHint="Fills in the email and password fields"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, gap: 8 },
  heading: { fontSize: 13, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { fontSize: 15, color: colors.textSecondary },
  value: { flexShrink: 1, fontSize: 15, fontWeight: '500', color: colors.text, fontVariant: ['tabular-nums'] },
  button: { marginTop: 4, minHeight: 44 },
});
