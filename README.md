# Drivewise

Drivewise is a mobile application for iOS and Android that uses on-device sensors to analyze driving behavior in real-time, compute safety scores, and classify driver performance. The app is built using React Native and Expo, featuring a dark-themed user interface designed for high contrast and readability during drives.

---

## Key Features

- **Start & End Drive Lifecycle**: Simple one-tap activation to start sensor logging and location tracking. Calibrates sensors and establishes GPS tracking instantly.
- **Active Drive Dashboard**: A live tracking interface showing current GPS speed (in km/h), real-time raw values for all integrated sensors, a live safety score that drops dynamically from 100, and individual counters for each detected event type.
- **Real-Time Event Detection**: Runs pure-logic threshold checks against sensor streams to detect harsh braking, harsh acceleration, sharp turns, aggressive steering, phone handling, and excessive device motion.
- **Session Summary**: Evaluates driving performance immediately after a session completes, presenting a summary containing:
  - Final safety score and color-coded rating badge.
  - Total elapsed drive duration.
  - Estimated drive distance.
  - Complete list of detected event counts and their respective point deductions.
- **Drive History Tracking**: Stores completed drives locally to view historical drives. Displays a list of previous drives with full event chips and scoring details, and supports tapping on any drive to view its detailed summary.
- **Sensor Error Handling**: Under no circumstance does the app simulate or mock data. If device sensors or location permissions are missing or unavailable, the app halts safely and presents a clear diagnostic error card explaining how to fix permissions.

---

## Tech Stack

- **Framework**: Expo SDK 55 & React Native 0.83.6
- **Language**: TypeScript (Strict mode)
- **Routing**: Expo Router (file-based navigation with layout grouping)
- **Sensors**: `expo-sensors` (Accelerometer, Gyroscope, DeviceMotion)
- **GPS Location**: `expo-location`
- **Storage**: `@react-native-async-storage/async-storage` (with in-memory dictionary fallback to guarantee app stability on debug/native builds)

---

## Sensor Integration & Processing Lifecycle

To ensure high reliability, the app uses three hardware sensors and location updates:
- **Accelerometer (100ms update rate)**: Measures acceleration in g-force across X, Y, and Z axes to identify longitudinal force variations.
- **Gyroscope (100ms update rate)**: Measures angular velocity in radians per second to monitor rotation rates.
- **DeviceMotion (200ms update rate)**: Monitors linear acceleration excluding gravity to measure pure device movement.
- **GPS / Location (1-second update rate)**: Pulls coordinates and speed measurements.

All sensor subscriptions are created upon starting a session and cleared immediately when ending a drive or when the screen unmounts, preventing memory leaks and preserving device battery.

---

## Event Detection & Thresholds

Driving events are computed via pure functions in `src/engine/eventDetector.ts` without any React dependencies or state side-effects.

- **Harsh Braking (`HARSH_BRAKE`)**: Deceleration along the Y-axis $\le -1.5\text{ g}$.
- **Harsh Acceleration (`HARSH_ACCEL`)**: Acceleration along the Y-axis $\ge 1.5\text{ g}$.
- **Sharp Turn (`SHARP_TURN`)**: Z-axis angular velocity $\ge 1.2\text{ rad/s}$.
- **Aggressive Steering (`AGGRESSIVE_STEER`)**: Angular velocity along either X or Z-axis $\ge 2.0\text{ rad/s}$.
- **Excessive Movement / Device Sway (`EXCESSIVE_MOVEMENT`)**: Linear acceleration magnitude excluding gravity $\ge 1.8\text{ m/s}^2$.
- **Phone Handling (`PHONE_HANDLING`)**: Total raw accelerometer magnitude $\ge 2.5\text{ g}$.

### Prioritization & Mutual Exclusion Rules
To avoid double-penalizing drivers for overlapping physical forces:
1. **Longitudinal Priority**: Accelerometer Y is checked first. If a harsh brake or acceleration is detected, phone handling checks are skipped for that reading.
2. **Steering Priority**: Aggressive steering (Gyro X or Z) is checked first. If triggered, sharp turn checks are skipped for that reading.

### Debouncing
A debounce window of `1500ms` is enforced per event type. Once an event fires, another event of the same type cannot trigger for 1.5 seconds.

---

## Scoring & Safety Ratings

Each drive begins with a score of `100`. Detected events deduct points from the score, capped at a minimum of `0`.

### Point Deductions
- **Phone Handling**: -10 points
- **Harsh Braking**: -5 points
- **Harsh Acceleration**: -5 points
- **Sharp Turn**: -3 points
- **Aggressive Steering**: -3 points
- **Excessive Movement**: -2 points

### Safety Classifications
- **Excellent**: 90–100
- **Good**: 75–89
- **Fair**: 60–74
- **Poor**: 40–59
- **Dangerous**: 0–39

---

## Performance Architecture

High-frequency sensor streams (100ms/10Hz) will freeze React UI rendering if they call `setState` directly on every update. To prevent this, the application decouples data capture from the UI:
1. **Ref Buffering**: Raw sensor data, the active event log, and the score are stored in React `useRef` objects, keeping callbacks fast and stateless.
2. **Throttled Updates**: A background interval runs every `250ms` (4Hz) to snapshot current sensor refs and update the UI display state, ensuring smooth 60fps rendering.
3. **Closure Safety**: At the end of a drive, data is written directly from the refs rather than stale state captures to ensure no final events are dropped.

---

## Local Development

### Prerequisites
- Node.js or Bun installed.
- Expo Go installed on a physical mobile device (recommended for testing sensors).

### Getting Started
1. Clone the repository and navigate to the project root.
2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```
3. Start the Expo development server:
   ```bash
   bunx expo start -c
   # or
   npx expo start -c
   ```
4. Scan the QR code displayed in the terminal with your mobile device's camera (iOS) or the Expo Go app (Android).

---

## Implementation Assumptions
- **Phone Orientation**: The detection thresholds assume the mobile device is fixed in a dashboard phone mount, aligning the Y-axis longitudinally (forward/backward acceleration) and the X-axis laterally (side-to-side steering forces).
- **Approximate Distance**: Without permanent GPS background tracking, drive distance is estimated as `durationSeconds * 0.0125 km` (an assumed average of 45 km/h) for simple representation in session summaries and history.
