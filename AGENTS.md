# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v55.0.0/ before writing any code.

---

## Project Overview

**Drivewise** is a React Native (Expo managed workflow) app that uses device sensors to analyze
driving behavior in real time and produce a safety score.

**Stack:** Expo SDK 55 · React Native · TypeScript · Expo Router · expo-sensors · React Native Reanimated

No external state libraries. All state is plain React `useState` / `useRef`.

---

## Project Structure

```
drivewise/
├── app/
│   ├── index.tsx           # Home screen — Start Drive button + last session card
│   ├── ActiveDriveScreen.tsx          # Live drive screen — sensors, events, score
│   ├── SessionSummary.tsx         # Post-drive summary — final score, breakdown
│   └── _layout.tsx
├── src/
│   ├── hooks/
│   │   └── useDrivingSensors.ts   # All sensor logic lives here
│   ├── engine/
│   │   ├── thresholds.ts          # All threshold constants — edit here only
│   │   ├── eventDetector.ts       # Pure detection logic (no React)
│   │   └── scoreEngine.ts         # Score + safety rating calculation
│   ├── types/
│   │   └── index.ts               # DriveEvent, SessionSummary types
│   └── components/
│       ├── ScoreRing.tsx          # Circular score display
│       ├── EventFeed.tsx          # Scrollable event list
│       └── SummaryCard.tsx        # Event breakdown card
├── app.json
├── tailwind.config.js
└── tsconfig.json
```

---

## Sensor Architecture

| Sensor | Expo API | Interval | Purpose |
|---|---|---|---|
| Accelerometer | `expo-sensors/Accelerometer` | 100ms | Braking, acceleration, phone handling |
| Gyroscope | `expo-sensors/Gyroscope` | 100ms | Sharp turns, aggressive steering |
| DeviceMotion | `expo-sensors/DeviceMotion` | 200ms | Composite movement |

### Sensor Lifecycle — Always Follow This Pattern

```ts
useEffect(() => {
  if (!isSessionActive) return;

  Accelerometer.setUpdateInterval(100);
  const sub = Accelerometer.addListener(handleReading);

  return () => sub.remove(); // cleanup is mandatory, no exceptions
}, [isSessionActive]);
```

- Start sensors only when `isSessionActive === true`
- Always unsubscribe in `useEffect` cleanup
- Request DeviceMotion permissions on iOS before subscribing

---

## Thresholds — `src/engine/thresholds.ts`

```ts
export const THRESHOLDS = {
  HARSH_BRAKE:          -1.5,   // accel.y (g) — harsh braking
  HARSH_ACCEL:           1.5,   // accel.y (g) — harsh acceleration
  PHONE_HANDLING:        2.5,   // accel magnitude (g) — phone picked up
  SHARP_TURN:            1.2,   // |gyro.z| (rad/s) — sharp turn
  AGGRESSIVE_STEER:      2.0,   // |gyro.z| (rad/s) — aggressive steering
  EXCESSIVE_MOVEMENT:    1.8,   // DeviceMotion magnitude (g)
  DEBOUNCE_MS:           1500,  // min ms between same-type events
} as const;
```

Never hardcode sensor values outside this file.

---

## Scoring — `src/engine/scoreEngine.ts`

```ts
export const PENALTIES: Record<DriveEventType, number> = {
  HARSH_BRAKE:        -5,
  HARSH_ACCEL:        -5,
  SHARP_TURN:         -3,
  AGGRESSIVE_STEER:   -3,
  PHONE_HANDLING:     -10,
  EXCESSIVE_MOVEMENT: -2,
};

// Score starts at 100, never below 0
export function calculateScore(events: DriveEvent[]): number {
  const total = events.reduce((sum, e) => sum + Math.abs(PENALTIES[e.type]), 0);
  return Math.max(0, 100 - total);
}

export const SAFETY_RATINGS = [
  { min: 90, label: "Excellent", color: "#22c55e" },
  { min: 75, label: "Good",      color: "#84cc16" },
  { min: 60, label: "Fair",      color: "#eab308" },
  { min: 40, label: "Poor",      color: "#f97316" },
  { min: 0,  label: "Dangerous", color: "#ef4444" },
];
```

---

## State Management

No Zustand, no Context. Just React state in each screen.

**`active.tsx` owns:**
```ts
const [events, setEvents] = useState<DriveEvent[]>([]);
const [score, setScore] = useState(100);
const [isSessionActive, setIsSessionActive] = useState(false);
const startTimeRef = useRef<number | null>(null);
const lastEventTimesRef = useRef<Record<DriveEventType, number>>({});
```

- `lastEventTimesRef` — debounce tracker, `useRef` not `useState` (no re-render needed)
- Raw sensor readings are processed in the listener callback, never stored in state
- On "End Drive": stop sensors → compute `SessionSummary` → navigate to `summary.tsx` with params

**Passing data to `summary.tsx`:**
```ts
// Serialize summary as a route param (keep it small)
router.push({
  pathname: '/summary',
  params: { summary: JSON.stringify(sessionSummary) }
});
```

---

## Types — `src/types/index.ts`

```ts
export type DriveEventType =
  | 'HARSH_BRAKE'
  | 'HARSH_ACCEL'
  | 'SHARP_TURN'
  | 'AGGRESSIVE_STEER'
  | 'PHONE_HANDLING'
  | 'EXCESSIVE_MOVEMENT';

export interface DriveEvent {
  id: string;
  type: DriveEventType;
  timestamp: number;
  sensorValue: number;
}

export interface SessionSummary {
  startTime: number;
  endTime: number;
  durationMs: number;
  events: DriveEvent[];
  finalScore: number;
  safetyRating: string;
  eventBreakdown: Record<DriveEventType, number>;
}
```

---

## Performance Rules

- Use `useRef` for debounce tracking and sensor buffers — not `useState`
- Never store raw sensor readings in React state
- Debounce all events using `THRESHOLDS.DEBOUNCE_MS`
- Memo `EventFeed` list items with `React.memo` to avoid re-render storms

---

## Styling

- No inline styles at all! Use stylesheet everywhere, and make sure it looks good in all screen
- Dark theme only — bg `#0a0a0a`, surface `#1a1a1a`
- Accent: `#b100d0ff` for score and highlights
- Severity colors: derive from the accent

---

## Agent Rules

1. **Thresholds only in `thresholds.ts`** — never inline sensor values elsewhere
2. **Detection logic only in `engine/`** — pure functions, no React imports
3. **Always clean up sensor subscriptions** — every `addListener` needs `sub.remove()` in cleanup
4. **No raw sensor data in state** — process in callback, store only `DriveEvent` objects
5. **No TypeScript `any`** — strict mode is on
6. **Permissions before sensors** — always request on iOS before subscribing
7. When adding a new event type → update all four: `thresholds.ts`, `PENALTIES`, `DriveEventType`, detection logic
8. **Dont overcomplicate things unnecessarily** just do the simplest thihg that will work.