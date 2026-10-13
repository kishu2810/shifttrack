import { router, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/constants/colors';
import { ShiftsProvider } from '@/context/ShiftsContext';

const modalOptions = {
  presentation: 'modal',
  headerLeft: () => (
    <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={12}>
      <Text style={styles.headerButton}>Cancel</Text>
    </Pressable>
  ),
} as const;

export default function AppLayout() {
  return (
    <ShiftsProvider>
      <Stack
        screenOptions={{
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'ShiftTrack',
            headerLargeTitleEnabled: true,
            headerLargeTitleShadowVisible: false,
            headerLargeStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen name="create-shift" options={{ title: 'Add Shift', ...modalOptions }} />
        <Stack.Screen name="edit-shift/[id]" options={{ title: 'Edit Shift', ...modalOptions }} />
      </Stack>
    </ShiftsProvider>
  );
}

const styles = StyleSheet.create({
  headerButton: { fontSize: 17, color: colors.primary },
});
