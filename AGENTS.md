# Drivewise Agent Instructions

## Goal
Build Drivewise, a mobile app that uses device sensors to detect driving behavior and generate a driving safety score.

This is an MVP-first project. Keep the implementation simple, stable, and easy to explain in a demo.

## Final MVP Scope
Build only these features:
1. Start Drive and End Drive
2. Live sensor capture during a session
3. Event detection for:
   - Harsh Braking
   - Harsh Acceleration
   - Sharp Turns
   - Aggressive Steering
   - Excessive Device Movement
   - Possible Phone Handling During Driving
4. Score calculation from 100 downward
5. Session summary screen
6. Basic dashboard with score, duration, and event breakdown

Do not add stretch goals unless the MVP is complete:
- Route replay
- Event heatmap
- AI feedback
- Historical comparison

## Tech Stack
- Expo SDK 55
- React Native
- TypeScript
- Expo Router
- expo-sensors
- React Native Reanimated only if needed for UI polish

## Non-Negotiable Rules
1. Use only plain React state (`useState`, `useRef`)
2. No external state libraries
3. No raw sensor streams in React state
4. All sensor cleanup must happen in `useEffect` cleanup
5. Debounce repeated events
6. Keep detection logic pure and outside React
7. Threshold values must live in one file only
8. No `any`
9. Keep the UI dark and clean
10. Do not overcomplicate the implementation

## Project Structure
- `app/index.tsx` — home screen with Start Drive
- `app/ActiveDriveScreen.tsx` — live drive session
- `app/SessionSummary.tsx` — final summary
- `app/_layout.tsx` — routing setup

- `src/hooks/useDrivingSensors.ts` — sensor subscriptions and session control
- `src/engine/thresholds.ts` — all threshold constants
- `src/engine/eventDetector.ts` — pure event detection logic
- `src/engine/scoreEngine.ts` — score and safety rating logic
- `src/types/index.ts` — shared types
- `src/components/` — reusable UI components

## Sensor Strategy
Use these sensors:
- Accelerometer
- Gyroscope
- Device Motion
- Magnetometer only if time permits

Recommended update intervals:
- Accelerometer: 100ms
- Gyroscope: 100ms
- Device Motion: 200ms
- Magnetometer: optional, 200ms or slower

## Event Detection Strategy
Use simple rule-based thresholds.

Example:
- Harsh Brake: negative Y acceleration spike
- Harsh Acceleration: positive Y acceleration spike
- Sharp Turn: large Z-axis gyroscope rotation
- Aggressive Steering: stronger Z-axis gyroscope rotation
- Excessive Movement: strong Device Motion magnitude
- Phone Handling: large accelerometer magnitude spike

Use debounce so the same event cannot fire repeatedly within a short period.

## Scoring
- Score starts at 100
- Apply penalties per detected event
- Never go below 0

Suggested penalties:
- Harsh Brake: -5
- Harsh Acceleration: -5
- Sharp Turn: -3
- Aggressive Steering: -3
- Phone Handling: -10
- Excessive Movement: -2

Safety ratings:
- 90–100: Excellent
- 75–89: Good
- 60–74: Fair
- 40–59: Poor
- 0–39: Dangerous

## Session Summary Must Show
- Drive duration
- Total events
- Event breakdown
- Final driving score
- Safety rating

## Performance Rules
- Use `useRef` for debounce timestamps and buffers
- Do not store raw sensor values in state
- Update UI only when an actual event occurs or a score changes
- Remove all sensor subscriptions on stop/unmount
- Keep components small and memoized where helpful

## Styling Rules
- Dark theme only - simple black and white theme
- Use stylesheet objects, not inline styles
- Keep spacing consistent
- Use one accent color for score and highlights
- Make the UI readable on small screens

## Implementation Priority
1. App navigation
2. Start/End drive session flow
3. Sensor subscriptions
4. Event detection
5. Score engine
6. Summary screen
7. Dashboard polish
8. Optional magnetometer
9. Optional extra visuals

## Output Quality
- Clean naming
- Small functions
- Simple logic
- Easy to explain in demo
- Reliable over fancy
- No over-engineering
- No unnecessary comments