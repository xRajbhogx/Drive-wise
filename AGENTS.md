# Drivewise Agent Instructions

## Goal
Build Drivewise, a mobile app that uses device sensors to detect driving behavior and generate a driving safety score.

This is an MVP-first project. Keep the implementation simple, stable, and easy to explain in a demo.

## MVP Status — COMPLETE
All MVP features are implemented and the app has been built via EAS for Android (development build).

### Completed features:
1. ✅ Start Drive and End Drive
2. ✅ Live sensor capture during a session (Accelerometer, Gyroscope, DeviceMotion)
3. ✅ Event detection for all 6 types
4. ✅ Score calculation from 100 downward (incremental, never below 0)
5. ✅ Session summary screen with all required fields
6. ✅ Dashboard with live sensor readings, GPS speed, score, and event breakdown

### Do not add stretch goals — MVP is complete:
- Route replay
- Event heatmap
- AI feedback
- Historical comparison

---

## Tech Stack
- Expo SDK 55
- React Native 0.83.6
- TypeScript (strict mode)
- Expo Router
- expo-sensors (~55.0.15) — Accelerometer, Gyroscope, DeviceMotion
- expo-location (~55.1.10) — GPS speed display
- expo-dev-client (~55.0.35) — required for development builds on device

---

## Non-Negotiable Rules
1. Use only plain React state (`useState`, `useRef`)
2. No external state libraries
3. No raw sensor streams in React state — store in `useRef`, throttle display updates
4. All sensor cleanup must happen in `useEffect` cleanup
5. Debounce repeated events using `lastEventTimesRef`
6. Keep detection logic pure and outside React — no imports from React in engine files
7. Threshold values must live in `src/engine/thresholds.ts` only — no hardcoded values elsewhere
8. No `any` types
9. Keep the UI dark and clean
10. Do not overcomplicate the implementation
11. Never call `setState` inside another `setState` updater function
12. All sensor callbacks passed to `useDrivingSensors` must be wrapped in `useCallback`
13. No simulation mode — if sensors are unavailable, show an error card, not fake events

---

## Project Structure

```
src/app/
  _layout.tsx            — Stack navigator setup (3 screens, no headers)
  index.tsx              — Home screen: Start Drive button + last session summary
  ActiveDriveScreen.tsx  — Live session: speed, sensor readings, event counters, End Drive
  SessionSummary.tsx     — Post-drive summary with score, breakdown, and ratings

src/hooks/
  useDrivingSensors.ts   — Sensor subscriptions, permission request, start/stop lifecycle

src/engine/
  thresholds.ts          — All threshold constants and DEBOUNCE_MS (single source of truth)
  eventDetector.ts       — Pure functions for detecting each event type
  scoreEngine.ts         — PENALTIES map, calculateScore(), getSafetyRating()

src/types/
  index.ts               — DriveEventType, DriveEvent, SafetyRating, SessionSummary

src/constants/
  theme.ts               — COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, FONT_WEIGHT

src/components/          — Currently empty (EventCard is a local component in ActiveDriveScreen)
```

---

## Sensor Strategy

### Sensors in use
- **Accelerometer** — 100ms interval
- **Gyroscope** — 100ms interval
- **DeviceMotion** — 200ms interval (uses `acceleration`, not `accelerationIncludingGravity`)
- Magnetometer — NOT implemented (deferred)

### Callback pattern
Raw sensor data flows through callbacks passed into `useDrivingSensors`. These callbacks:
- Are defined in the screen component
- Must be wrapped in `useCallback`
- Write to `useRef` for display, never directly to state
- Call `handleEventDetected` when a threshold is crossed

### Display refresh
A `setInterval` at 250ms copies the latest sensor refs to `liveReadings` state for the UI panel. This decouples raw sensor frequency (100ms) from render frequency (250ms).

---

## Event Detection Strategy

All detection functions are in `src/engine/eventDetector.ts` and are pure — no side effects, no React.

| Event | Sensor | Axis / Value | Threshold |
|---|---|---|---|
| HARSH_BRAKE | Accelerometer | Y (negative) | `<= -1.5` g |
| HARSH_ACCEL | Accelerometer | Y (positive) | `>= +1.5` g |
| PHONE_HANDLING | Accelerometer | magnitude | `>= 2.5` g |
| SHARP_TURN | Gyroscope | \|Z\| | `>= 1.2` rad/s |
| AGGRESSIVE_STEER | Gyroscope | \|X\| or \|Z\| | `>= 2.0` rad/s |
| EXCESSIVE_MOVEMENT | DeviceMotion | magnitude | `>= 1.8` m/s² |

### Priority / mutual exclusion rules
- `HARSH_BRAKE` and `HARSH_ACCEL` are checked first on accelerometer; if either fires, `PHONE_HANDLING` is skipped for that reading.
- `AGGRESSIVE_STEER` supersedes `SHARP_TURN` — checked first; if it fires, `SHARP_TURN` is skipped for the same reading. This prevents double-penalizing one maneuver.

### Debounce
`DEBOUNCE_MS = 1500` — the same event type cannot fire more than once per 1.5 seconds. Tracked via `lastEventTimesRef` (a `useRef<Record<string, number>>`).

---

## Scoring

- Score starts at 100
- **Incremental update**: `setScore(prev => Math.max(0, prev - PENALTIES[type]))` — never recalculate from scratch
- Score is never stored in `eventsRef`; it lives in `useState`
- `eventsRef` holds the full `DriveEvent[]` array (append-only, no re-render)
- `eventCounts` state (`Record<DriveEventType, number>`) holds per-type counters for the UI grid

### Penalty values (from `scoreEngine.ts`)
| Event | Penalty |
|---|---|
| HARSH_BRAKE | -5 |
| HARSH_ACCEL | -5 |
| SHARP_TURN | -3 |
| AGGRESSIVE_STEER | -3 |
| PHONE_HANDLING | -10 |
| EXCESSIVE_MOVEMENT | -2 |

### Safety ratings
| Score range | Rating |
|---|---|
| 90–100 | Excellent |
| 75–89 | Good |
| 60–74 | Fair |
| 40–59 | Poor |
| 0–39 | Dangerous |

---

## GPS Speed

`expo-location` is used to display current GPS speed in km/h at the top of `ActiveDriveScreen`.
- Accuracy: `Location.Accuracy.Balanced`
- Update interval: 1000ms, 1m distance filter
- Speed is display-only and does not affect scoring
- Shows `--` if GPS permission is denied or not yet acquired
- `watchPositionAsync` subscription is stored in `locationSubscriptionRef` and removed on unmount/end

---

## State Architecture in ActiveDriveScreen

| Data | Storage | Reason |
|---|---|---|
| Full event list | `eventsRef` (useRef) | Needed for summary, never drives UI |
| Per-type event counts | `eventCounts` (useState) | Drives the event grid UI |
| Current score | `score` (useState) | Drives score display |
| Raw sensor readings | `latestAccelRef`, `latestGyroRef`, `latestMotionMagRef` | No render on every reading |
| Display snapshot | `liveReadings` (useState) | Updated at 250ms from refs |
| GPS speed | `speedKmh` (useState) | Drives speed display |
| Debounce timestamps | `lastEventTimesRef` | Guards repeated events |
| Session start time | `startTimeRef` | Duration calculation at end |

---

## Session Summary Must Show
- Drive duration (formatted as `Xm Ys`)
- GPS estimated distance (duration × 0.0125 km — approximate only, labeled "Distance")
- Total events
- Event breakdown by type with penalty per event shown
- Final driving score
- Safety rating (color-coded badge)

---

## Performance Rules
- Use `useRef` for debounce timestamps, sensor buffers, and the event log
- Do not store raw sensor values in state
- Throttle display updates via a 250ms interval — do not call `setState` in every sensor callback
- Score updated incrementally via functional `setScore`, not by iterating the event array
- Remove all sensor subscriptions and location subscription on stop/unmount
- Wrap all sensor callbacks in `useCallback`
- Read end-of-session score via functional `setScore(current => { ... return current; })` to avoid stale closures

---

## Styling Rules
- Dark theme only (`#0a0a0a` background, `#1a1a1a` surface, `#FFFFFF` text/accent)
- Use `StyleSheet.create`, not inline style objects (except for dynamic values)
- Spacing and border-radius from `theme.ts` constants only
- Score color is dynamic: green ≥ 90, yellow ≥ 60, red < 60
- Event cards highlight their border and count in the event's severity color when count > 0

---

## Output Quality
- Clean naming
- Small functions
- Simple logic
- Easy to explain in a demo
- Reliable over fancy
- No over-engineering
- No unnecessary comments
- No simulation mode under any circumstance