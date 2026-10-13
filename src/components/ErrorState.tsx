import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

import { Button } from './Button';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry: () => void;
  retrying?: boolean;
};

export function ErrorState({ title = 'Something went wrong', message, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title="Retry" onPress={onRetry} loading={retrying} style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.dangerMuted,
    borderRadius: 14,
    padding: 24,
    gap: 8,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.danger, textAlign: 'center' },
  message: { fontSize: 15, color: colors.text, textAlign: 'center', lineHeight: 21 },
  action: { marginTop: 8, alignSelf: 'stretch' },
});
