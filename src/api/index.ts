import { mockApi } from './mockApi';
import type { ShiftTrackApi } from './types';

// Swap this for a real HTTP implementation of ShiftTrackApi when a backend exists.
export const api: ShiftTrackApi = mockApi;

export { ApiError, getErrorMessage } from './types';
