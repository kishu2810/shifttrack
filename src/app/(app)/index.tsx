import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/api';
import { ActiveShiftCard } from '@/components/ActiveShiftCard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { MockControls } from '@/components/MockControls';
import { ShiftCard } from '@/components/ShiftCard';
import { StartShiftCard } from '@/components/StartShiftCard';
import { WeekNavigator } from '@/components/WeekNavigator';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useShifts } from '@/context/ShiftsContext';
import type { Shift } from '@/types/shift';
import { isDateKeyInWeek, toDateKey } from '@/utils/date';
import { calculateDuration, formatDuration } from '@/utils/duration';

async function runWithAlert(action: () => Promise<void>, title = 'Something went wrong') {
  try {
    await action();
  } catch (error) {
    Alert.alert(title, getErrorMessage(error));
  }
}

export default function ShiftsScreen() {
  const { session, logout } = useAuth();
  const {
    shifts,
    activeShift,
    weekStart,
    weekOffset,
    status,
    errorMessage,
    isRefreshing,
    isStarting,
    isEnding,
    deletingId,
    reload,
    refresh,
    startShift,
    endShift,
    deleteShift,
    changeWeek,
  } = useShifts();

  // The API always includes the active shift; only list it under the week it belongs to.
  const weekShifts = useMemo(() => {
    const weekStartKey = toDateKey(weekStart);
    return shifts.filter((shift) => isDateKeyInWeek(shift.date, weekStartKey));
  }, [shifts, weekStart]);

  const completedTotalMs = useMemo(
    () => weekShifts.filter((shift) => shift.endTime !== null).reduce((total, shift) => total + calculateDuration(shift), 0),
    [weekShifts],
  );

  const openCreateShift = () => router.push('/create-shift');

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => runWithAlert(logout) },
    ]);

  const confirmEndShift = () =>
    Alert.alert('End shift?', 'Your shift will be saved with the current time as its end.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Shift', style: 'destructive', onPress: () => runWithAlert(endShift) },
    ]);

  const confirmDeleteShift = (shift: Shift) =>
    Alert.alert('Delete Shift?', 'Are you sure you want to delete this shift?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => runWithAlert(() => deleteShift(shift.id)) },
    ]);

  const header = (
    <View style={styles.header}>
      <Text style={styles.greeting}>Hi, {session?.user.name}</Text>

      {status === 'ready' ? (
        activeShift ? (
          <ActiveShiftCard shift={activeShift} onEnd={confirmEndShift} isEnding={isEnding} />
        ) : (
          <StartShiftCard onStart={() => runWithAlert(startShift, 'Unable to start shift')} isStarting={isStarting} />
        )
      ) : null}

      <WeekNavigator weekStart={weekStart} weekOffset={weekOffset} onChange={changeWeek} />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionSubtitle}>
          {status === 'ready' && weekShifts.length > 0 ? `${formatDuration(completedTotalMs)} worked` : ''}
        </Text>
        <Pressable onPress={openCreateShift} accessibilityRole="button" hitSlop={8} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Shift</Text>
        </Pressable>
      </View>
    </View>
  );

  const emptyContent =
    status === 'loading' ? (
      <LoadingState message="Loading shifts…" />
    ) : status === 'error' ? (
      <ErrorState
        title="Unable to load shifts"
        message={errorMessage ?? 'Something went wrong while loading your shifts.'}
        onRetry={reload}
      />
    ) : (
      <EmptyState
        title={weekOffset === 0 ? 'No shifts this week' : 'No shifts for this week'}
        message={weekOffset === 0 ? "You haven't created any shifts yet." : 'No shifts were recorded for this week.'}
        actionLabel="Add Shift"
        onAction={openCreateShift}
      />
    );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={confirmLogout} accessibilityRole="button" hitSlop={12}>
              <Text style={styles.logout}>Log Out</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={status === 'ready' ? weekShifts : []}
        keyExtractor={(shift) => shift.id}
        renderItem={({ item }) => (
          <ShiftCard
            shift={item}
            onEdit={() => router.push({ pathname: '/edit-shift/[id]', params: { id: item.id } })}
            onDelete={() => confirmDeleteShift(item)}
            isDeleting={deletingId === item.id}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyContent}
        ListFooterComponent={__DEV__ ? <MockControls onDataReset={reload} /> : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  header: { gap: 16, marginBottom: 12 },
  greeting: { fontSize: 17, color: colors.textSecondary },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionSubtitle: { fontSize: 15, color: colors.textSecondary },
  addButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  addButtonText: { fontSize: 17, fontWeight: '600', color: colors.primary },
  separator: { height: 12 },
  logout: { fontSize: 17, color: colors.primary },
});
