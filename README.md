# ShiftTrack

An iOS-first React Native app for staff to log in, view the current week's shifts, add completed shifts, and clock in/out of an active shift with a live timer that stays correct across backgrounding and app restarts.

## Tech Stack

- React Native 0.86
- Expo SDK 57
- TypeScript (strict)
- Expo Router (file-based navigation, `Stack.Protected` auth guards)
- `expo-secure-store` for the auth session
- `@react-native-async-storage/async-storage` for the mock backend's shift data
- `@react-native-community/datetimepicker` for native date/time inputs
- In-app mock API (no real backend)

## Features

- Email/password login with validation, loading state, double-submit protection and a clear error for wrong credentials
- Session stored in the iOS Keychain / Android Keystore via SecureStore; restored on launch; cleared on logout
- Current week (Mon–Sun, computed from the device date) with date, start → end, break, total and a weekly total
- Previous / next week navigation; tap the week title to jump back to the current week
- Add Shift form with native pickers, inline validation (end after start, break ≥ 0 and shorter than the shift), live total preview, loading state and double-submit protection
- Edit Shift for completed shifts, using the same form and validation, pre-filled with the shift's values
- Delete Shift for completed shifts, with a confirmation alert and per-card loading state
- Start / End Shift with a live elapsed timer; only one active shift can exist (enforced in the UI, the state layer and the mock API)
- Active shift and timer survive backgrounding, screen remounts and full app restarts
- Loading skeleton, empty state, and error state with a working Retry
- Pull to refresh; silent refresh when the app returns to the foreground (also rolls over to a new week)

## Architecture

```text
src/
  app/                    Expo Router routes (screens only)
    _layout.tsx           AuthProvider + protected stack (login vs. app)
    login.tsx
    (app)/_layout.tsx     ShiftsProvider + app stack
    (app)/index.tsx       This Week screen
    (app)/create-shift.tsx  Add Shift modal
    (app)/edit-shift/[id].tsx  Edit Shift modal
  api/                    ShiftTrackApi contract, mock implementation, ApiError
  context/                AuthContext, ShiftsContext (state + actions)
  components/             Button, Input, DateTimeField, ShiftForm, ShiftCard, ActiveShiftCard,
                          StartShiftCard, WeekNavigator, LoadingState, EmptyState, ErrorState, MockControls
  hooks/useElapsedTime.ts Live timer derived from a timestamp
  storage/                authStorage (SecureStore), shiftStorage (AsyncStorage)
  types/                  Session, User, Shift
  utils/                  date, duration, validation (pure functions)
  constants/colors.ts
```

- **UI** — screens and small presentational components. They read state from contexts and never call storage or the mock directly.
- **API layer** — `src/api/types.ts` defines the `ShiftTrackApi` interface (one method per endpoint). `src/api/index.ts` exports `api = mockApi`; replacing it with an HTTP client that implements the same interface requires no UI changes.
- **Storage** — `authStorage` wraps SecureStore for the session; `shiftStorage` wraps AsyncStorage and acts as the mock backend's database.
- **Business logic** — `AuthContext` handles login/restore/logout. `ShiftsContext` loads the selected week (stored as an offset from the current week, so week 0 rolls over automatically), derives the active shift, and owns create/start/end/update/delete with in-flight guards. Add and Edit share one `ShiftForm` component. Date and duration maths live in `utils/` and are reused everywhere.
- **State** — React Context and hooks only; no Redux/Zustand/React Query.

## Running

```bash
npm install
npx expo start
```

Then press:

- `i` — open in the **iOS Simulator** (requires Xcode)
- `a` — open in an **Android Emulator** (requires Android Studio)
- Or scan the QR code with **Expo Go** on a physical device (same network)

All native modules used are bundled in Expo Go, so no development build is required.

Checks:

```bash
npm test
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Tests

Jest with the `jest-expo` preset (`npm test`). Tests cover business logic, not UI snapshots:

- `src/utils/__tests__/duration-test.ts` — completed-shift duration (09:00 → 17:30 with a 30 min break = 8h), active elapsed time from `Date.now() - startTime`, clamping to zero
- `src/utils/__tests__/validation-test.ts` — end before/equal to start, valid shift, negative/empty break, break longer than the shift, login validation
- `src/utils/__tests__/date-test.ts` — Monday week start, local date-key parsing, week membership
- `src/api/__tests__/mockApi-test.ts` — wrong credentials, single active shift, PATCH, DELETE (active shift cannot be deleted), simulated errors

## Test Login

```text
Email: staff@shifttrack.test
Password: Password123
```

These are assessment-provided mock credentials and exist only in the mock layer (`src/api/mockApi.ts`).

## Mock API

`src/api/mockApi.ts` implements:

| Endpoint | Method |
| --- | --- |
| `POST /auth/login` | `api.login(credentials)` |
| `GET /shifts?weekStart=YYYY-MM-DD` | `api.getShifts(weekStart)` — the week's shifts plus any active shift |
| `POST /shifts` | `api.createShift(input)` |
| `PATCH /shifts/:id` | `api.updateShift(id, changes)` |
| `DELETE /shifts/:id` | `api.deleteShift(id)` |

- Every request waits ~700 ms to simulate network latency.
- Data persists in AsyncStorage, so it survives restarts like a real server would. Logout does not delete shifts.
- The mock validates like a server would: 401 for wrong credentials, 400 for invalid times, 404 for unknown shifts, 409 when a second active shift is attempted or the active shift is deleted.
- Errors are thrown as `ApiError` with a user-facing message and status code.

**Triggering an error state:** in development builds, a **Mock API (dev only)** panel appears at the bottom of the shifts screen:

- **Simulate API errors** — when on, every request fails with a 500. Pull to refresh (or Reset demo data) to see the "Unable to load shifts" state, turn the switch off, then tap **Retry**.
- **Reset demo data** — clears all shifts to show the empty state.

Programmatically: `setSimulateErrors(true)` from `src/api/mockApi.ts`.

## Timer Design

The elapsed time is **never stored or incremented**. It is always calculated from the shift's persisted `startTime`:

```ts
elapsedMs = Math.max(0, Date.now() - new Date(startTime).getTime());
```

`useElapsedTime` runs a 1-second `setInterval` purely to trigger a re-render, and also refreshes immediately when `AppState` becomes `active`. Because the value is derived from a timestamp, it stays correct when the app is backgrounded, JS timers are paused, the device sleeps, the screen remounts, or the app is killed and reopened — on launch the active shift (`endTime === null`) is loaded from storage and the timer resumes from its original start time.

Ending a shift sends `PATCH /shifts/:id` with `endTime = new Date().toISOString()`. Completed durations are `end − start − breakMinutes`, clamped at zero.

## Assessment Notes

Completed:

- Login with validation, loading, wrong-credential error and double-tap protection
- Secure session persistence and restoration; logout clears it
- Current week view with dynamic week start (Monday)
- Add Shift with native pickers, validation and double-submit protection
- Start/End active shift with a timestamp-based live timer; single active shift enforced
- Timer verified correct after killing and relaunching the app in the iOS Simulator
- Loading skeleton, empty state, error state with working Retry, simulated API errors
- Edit and delete completed shifts (active shifts can only be ended, not edited or deleted)
- Previous / next week navigation; Add Shift defaults to and is limited to the selected week
- Jest unit tests for duration, timer, validation, dates and mock API rules (26 tests)
- Typecheck, lint and `expo-doctor` pass; iOS and Android bundles build

Unfinished / limitations:

- No UI/component tests; tests cover pure logic and the mock API
- Shifts that cross midnight cannot be entered via the form (end must be after start on the same date)
- Started shifts begin with a 0-minute break; there is no break entry when ending a shift
- The form only allows dates within the shown week (Add: selected week; Edit: the shift's week), so a shift can't be moved to another week
- No overlap detection between shifts
- The mock token is not validated on shift requests and does not expire
- Light mode only
