import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { calculateElapsedTime } from '@/utils/duration';

/**
 * Live elapsed time for an active shift.
 * The interval only triggers re-renders; the value is always derived from the stored start
 * timestamp, so it stays correct after backgrounding, JS timer pauses or a full app restart.
 */
export function useElapsedTime(startTime: string, refreshMs = 1000): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const interval = setInterval(refresh, refreshMs);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshMs]);

  return calculateElapsedTime(startTime, now);
}
