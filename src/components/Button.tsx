import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';

type Variant = 'primary' | 'secondary' | 'danger';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

const variantStyles: Record<Variant, { background: string; pressed: string; text: string }> = {
  primary: { background: colors.primary, pressed: colors.primaryPressed, text: '#FFFFFF' },
  secondary: { background: colors.primaryMuted, pressed: '#D4E3FA', text: colors.primary },
  danger: { background: colors.danger, pressed: '#9E1F25', text: '#FFFFFF' },
};

export function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, accessibilityHint, style }: ButtonProps) {
  const palette = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: pressed ? palette.pressed : palette.background },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={palette.text} /> : <Text style={[styles.title, { color: palette.text }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.55 },
  title: { fontSize: 17, fontWeight: '600' },
});
