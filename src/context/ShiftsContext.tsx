import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { api, ApiError, getErrorMessage } from '@/api';
import type { CreateShiftInput, Shift, UpdateShiftInput } from '@/types/shift';
import { addDays, getWeekStart, toDateKey } from '@/utils/date';
import { getShiftConflict, type ShiftTimes } from '@/utils/shiftOverlap';

type LoadStatus = 'loading' | 'ready' | 'error';

type ShiftsContextValue = {
  /** Shifts in the selected week, plus the active shift (which may belong to another week). */
  shifts: Shift[];
  activeShift: Shift | null;
  /** Monday of the selected week. */
  weekStart: Date;
  /** 0 = current week, -1 = previous week, 1 = next week, … */
  weekOffset: number;
  status: LoadStatus;
  errorMessage: string | null;
  isRefreshing: boolean;
  isStarting: boolean;
  isEnding: boolean;
  deletingId: string | null;
  /** Shows the loading state and fetches again (used by Retry). */
  reload: () => Promise<void>;
  /** Pull-to-refresh: keeps the list visible while fetching. */
  refresh: () => Promise<void>;
  createShift: (input: CreateShiftInput) => Promise<Shift>;
  startShift: () => Promise<void>;
  endShift: () => Promise<void>;
  updateShift: (id: string, changes: UpdateShiftInput) => Promise<Shift>;
  deleteShift: (id: string) => Promise<void>;
  changeWeek: (weekOffset: number) => void;
};

const ShiftsContext = createContext<ShiftsContextValue | null>(null);

// Computed from "now" each time so the current week rolls over in a long-running app.
const weekStartForOffset = (weekOffset: number) => addDays(getWeekStart(), weekOffset * 7);

const upsert = (shifts: Shift[], shift: Shift) =>
  [...shifts.filter((item) => item.id !== shift.id), shift].sort((a, b) => a.startTime.localeCompare(b.startTime));

export function ShiftsProvider({ children }: { children: ReactNode }) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekStart, setWeekStart] = useState(() => weekStartForOffset(0));
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Refs guard against double taps before React has re-rendered the disabled button.
  const startInFlight = useRef(false);
  const endInFlight = useRef(false);
  const deleteInFlight = useRef(false);
  const latestRequestId = useRef(0);
  const weekOffsetRef = useRef(0);

  const fetchShifts = useCallback(({ reportErrors }: { reportErrors: boolean }) => {
    const requestId = ++latestRequestId.current;
    const requestedWeekStart = weekStartForOffset(weekOffsetRef.current);
    return api.getShifts(toDateKey(requestedWeekStart)).then(
      (result) => {
        if (requestId !== latestRequestId.current) return;
        setShifts(result);
        setWeekStart(requestedWeekStart);
        setErrorMessage(null);
        setStatus('ready');
      },
      (error: unknown) => {
        if (requestId !== latestRequestId.current) return;
        // A failed background refresh keeps showing the data we already have.
        if (reportErrors) {
          setErrorMessage(getErrorMessage(error));
          setStatus('error');
        }
      },
    );
  }, []);

  const backgroundRefresh = useCallback(() => fetchShifts({ reportErrors: false }), [fetchShifts]);

  const reload = useCallback(async () => {
    setStatus('loading');
    await fetchShifts({ reportErrors: true });
  }, [fetchShifts]);

  const changeWeek = useCallback(
    (nextOffset: number) => {
      weekOffsetRef.current = nextOffset;
      setWeekOffset(nextOffset);
      setWeekStart(weekStartForOffset(nextOffset));
      setStatus('loading');
      fetchShifts({ reportErrors: true });
    },
    [fetchShifts],
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchShifts({ reportErrors: true });
    setIsRefreshing(false);
  }, [fetchShifts]);

  useEffect(() => {
    fetchShifts({ reportErrors: true });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') backgroundRefresh();
    });
    return () => subscription.remove();
  }, [fetchShifts, backgroundRefresh]);

  const activeShift = useMemo(() => shifts.find((shift) => shift.endTime === null) ?? null, [shifts]);

  // Instant feedback against the loaded shifts; the API re-checks against all shifts.
  const assertNoConflict = useCallback(
    (candidate: ShiftTimes, excludeId?: string) => {
      const conflict = getShiftConflict(candidate, shifts, { excludeId });
      if (conflict) throw new ApiError(conflict, 409);
    },
    [shifts],
  );

  const createShift = useCallback(
    async (input: CreateShiftInput) => {
      assertNoConflict(input);
      const created = await api.createShift(input);
      setShifts((current) => upsert(current, created));
      backgroundRefresh();
      return created;
    },
    [assertNoConflict, backgroundRefresh],
  );

  const startShift = useCallback(async () => {
    if (startInFlight.current || activeShift) return;
    const now = new Date();
    assertNoConflict({ startTime: now.toISOString(), endTime: null });
    startInFlight.current = true;
    setIsStarting(true);
    try {
      const created = await api.createShift({
        date: toDateKey(now),
        startTime: now.toISOString(),
        endTime: null,
        breakMinutes: 0,
      });
      setShifts((current) => upsert(current, created));
      backgroundRefresh();
    } finally {
      startInFlight.current = false;
      setIsStarting(false);
    }
  }, [activeShift, assertNoConflict, backgroundRefresh]);

  const endShift = useCallback(async () => {
    if (endInFlight.current || !activeShift) return;
    endInFlight.current = true;
    setIsEnding(true);
    try {
      const updated = await api.updateShift(activeShift.id, { endTime: new Date().toISOString() });
      setShifts((current) => upsert(current, updated));
      backgroundRefresh();
    } finally {
      endInFlight.current = false;
      setIsEnding(false);
    }
  }, [activeShift, backgroundRefresh]);

  const updateShift = useCallback(
    async (id: string, changes: UpdateShiftInput) => {
      // Active shifts are only closed through endShift, so the timer workflow can't be bypassed.
      if (activeShift?.id === id) throw new ApiError('End the active shift before editing it.', 409);
      const current = shifts.find((shift) => shift.id === id);
      if (current) assertNoConflict({ ...current, ...changes }, id);
      const updated = await api.updateShift(id, changes);
      setShifts((current) => upsert(current, updated));
      backgroundRefresh();
      return updated;
    },
    [activeShift, shifts, assertNoConflict, backgroundRefresh],
  );

  const deleteShift = useCallback(
    async (id: string) => {
      if (deleteInFlight.current) return;
      deleteInFlight.current = true;
      setDeletingId(id);
      try {
        await api.deleteShift(id);
        setShifts((current) => current.filter((shift) => shift.id !== id));
        backgroundRefresh();
      } finally {
        deleteInFlight.current = false;
        setDeletingId(null);
      }
    },
    [backgroundRefresh],
  );

  const value = useMemo(
    () => ({
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
      createShift,
      startShift,
      endShift,
      updateShift,
      deleteShift,
      changeWeek,
    }),
    [
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
      createShift,
      startShift,
      endShift,
      updateShift,
      deleteShift,
      changeWeek,
    ],
  );

  return <ShiftsContext.Provider value={value}>{children}</ShiftsContext.Provider>;
}

export function useShifts(): ShiftsContextValue {
  const context = useContext(ShiftsContext);
  if (!context) throw new Error('useShifts must be used inside ShiftsProvider');
  return context;
}
