import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Shift } from '@/types/shift';

// Acts as the mock backend's database. Shift data is not sensitive, so AsyncStorage is fine.
const SHIFTS_KEY = 'shifttrack.mock.shifts';

export async function readShifts(): Promise<Shift[]> {
  const raw = await AsyncStorage.getItem(SHIFTS_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Shift[]) : [];
  } catch {
    return [];
  }
}

export async function writeShifts(shifts: Shift[]): Promise<void> {
  await AsyncStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts));
}

export async function clearShifts(): Promise<void> {
  await AsyncStorage.removeItem(SHIFTS_KEY);
}
