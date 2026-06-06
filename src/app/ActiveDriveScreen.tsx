import React, { useState, useEffect, useRef, useCallback } from "react";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useDrivingSensors } from "../hooks/useDrivingSensors";
import {
  detectHarshBrake,
  detectHarshAcceleration,
  detectSharpTurn,
  detectAggressiveSteering,
  detectPhoneHandling,
  detectExcessiveMovement,
} from "../engine/eventDetector";
import { getSafetyRating, PENALTIES } from "../engine/scoreEngine";
import { THRESHOLDS } from "../engine/thresholds";
import { DriveEvent, DriveEventType, SessionSummary } from "../types";
import { setLastSessionSummary, addSessionToHistory } from "../store/historyStore";
import StartingView from "../components/ActiveDrive/StartingView";
import SensorErrorView from "../components/ActiveDrive/SensorErrorView";
import ActiveDashboardView from "../components/ActiveDrive/ActiveDashboardView";

// --- Types ---
interface SensorReading {
  x: number;
  y: number;
  z: number;
}

interface LiveReadings {
  accel: SensorReading;
  gyro: SensorReading;
  motionMag: number;
}

// --- Component ---
export default function ActiveDriveScreen() {
  // Session events as an array — used only for the summary at end
  const eventsRef = useRef<DriveEvent[]>([]);

  // Score and event counts are the only state that drives UI updates
  const [score, setScore] = useState<number>(100);
  const scoreRef = useRef<number>(100); // mirrors score for stale-closure-free reads
  const [eventCounts, setEventCounts] = useState<Record<DriveEventType, number>>({
    HARSH_BRAKE: 0,
    HARSH_ACCEL: 0,
    SHARP_TURN: 0,
    AGGRESSIVE_STEER: 0,
    PHONE_HANDLING: 0,
    EXCESSIVE_MOVEMENT: 0,
  });

  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sensorError, setSensorError] = useState<string | null>(null);

  // GPS speed (km/h)
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);

  // Sensor display — updated every 250ms from refs, NOT on every raw reading
  const [liveReadings, setLiveReadings] = useState<LiveReadings>({
    accel: { x: 0, y: 0, z: 0 },
    gyro: { x: 0, y: 0, z: 0 },
    motionMag: 0,
  });

  // Refs — hold latest raw sensor values without causing re-renders
  const latestAccelRef = useRef<SensorReading>({ x: 0, y: 0, z: 0 });
  const latestGyroRef = useRef<SensorReading>({ x: 0, y: 0, z: 0 });
  const latestMotionMagRef = useRef<number>(0);

  const startTimeRef = useRef<number | null>(null);
  const lastEventTimesRef = useRef<Record<string, number>>({});
  const displayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // --- Core event handler ---
  const handleEventDetected = useCallback((type: DriveEventType, value: number) => {
    const now = Date.now();
    const lastTime = lastEventTimesRef.current[type] ?? 0;
    if (now - lastTime < THRESHOLDS.DEBOUNCE_MS) return;

    lastEventTimesRef.current[type] = now;

    const newEvent: DriveEvent = {
      id: `${type}_${now}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      timestamp: now,
      value,
    };

    // Append to ref array (no re-render)
    eventsRef.current = [...eventsRef.current, newEvent];

    // Incremental score update — no full recalculation
    const newScore = Math.max(0, scoreRef.current - PENALTIES[type]);
    scoreRef.current = newScore;
    setScore(newScore);

    // Increment count for the specific event type
    setEventCounts((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
  }, []);

  // --- Sensor callbacks — all wrapped in useCallback ---

  const onAccelerometerData = useCallback(
    (data: { x: number; y: number; z: number }) => {
      // Store latest reading in ref for display
      latestAccelRef.current = { x: data.x, y: data.y, z: data.z };

      // Harsh Brake: strong negative Y (deceleration)
      const harshBrake = detectHarshBrake(data.y);
      if (harshBrake) {
        handleEventDetected(harshBrake, data.y);
        return; // Avoid evaluating HARSH_ACCEL on the same sample
      }

      // Harsh Acceleration: strong positive Y
      const harshAccel = detectHarshAcceleration(data.y);
      if (harshAccel) {
        handleEventDetected(harshAccel, data.y);
        return;
      }

      // Phone handling: overall magnitude spike
      const phoneHandling = detectPhoneHandling(data.x, data.y, data.z);
      if (phoneHandling) {
        const mag = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
        handleEventDetected(phoneHandling, mag);
      }
    },
    [handleEventDetected]
  );

  const onGyroscopeData = useCallback(
    (data: { x: number; y: number; z: number }) => {
      latestGyroRef.current = { x: data.x, y: data.y, z: data.z };

      // Aggressive steering supersedes sharp turn — check higher threshold first
      const aggressiveSteer = detectAggressiveSteering(data.x, data.z);
      if (aggressiveSteer) {
        const maxVal = Math.max(Math.abs(data.x), Math.abs(data.z));
        handleEventDetected(aggressiveSteer, maxVal);
        return; // Don't also fire SHARP_TURN for the same reading
      }

      const sharpTurn = detectSharpTurn(data.z);
      if (sharpTurn) {
        handleEventDetected(sharpTurn, data.z);
      }
    },
    [handleEventDetected]
  );

  const onDeviceMotionData = useCallback(
    (data: { acceleration: { x: number; y: number; z: number } | null }) => {
      if (!data.acceleration) return;
      const { x, y, z } = data.acceleration;
      const mag = Math.sqrt(x * x + y * y + z * z);
      latestMotionMagRef.current = mag;

      const excessiveMovement = detectExcessiveMovement(x, y, z);
      if (excessiveMovement) {
        handleEventDetected(excessiveMovement, mag);
      }
    },
    [handleEventDetected]
  );

  const { startSensors, stopSensors } = useDrivingSensors({
    onAccelerometerData,
    onGyroscopeData,
    onDeviceMotionData,
  });

  // --- Display refresh interval: copies refs → state every 250ms ---
  const startDisplayInterval = useCallback(() => {
    if (displayIntervalRef.current) return;
    displayIntervalRef.current = setInterval(() => {
      setLiveReadings({
        accel: { ...latestAccelRef.current },
        gyro: { ...latestGyroRef.current },
        motionMag: latestMotionMagRef.current,
      });
    }, 250);
  }, []);

  const stopDisplayInterval = useCallback(() => {
    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
      displayIntervalRef.current = null;
    }
  }, []);

  // --- GPS speed tracking ---
  const startLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (loc) => {
          const speedMs = loc.coords.speed ?? 0;
          setSpeedKmh(Math.max(0, speedMs * 3.6));
        }
      );
    } catch {
      // GPS unavailable — just don't show speed
    }
  }, []);

  const stopLocationTracking = useCallback(() => {
    locationSubscriptionRef.current?.remove();
    locationSubscriptionRef.current = null;
  }, []);

  // --- Session startup ---
  useEffect(() => {
    let isActive = true;

    const start = async () => {
      const success = await startSensors();
      if (!isActive) return;

      if (success) {
        startTimeRef.current = Date.now();
        setIsSessionActive(true);
        startDisplayInterval();
        startLocationTracking();
      } else {
        setSensorError(
          "Sensor access denied or unavailable.\nGo to Settings and grant motion permissions, then restart the drive."
        );
      }
    };

    start();

    return () => {
      isActive = false;
      stopSensors();
      stopDisplayInterval();
      stopLocationTracking();
    };
  }, [startSensors, stopSensors, startDisplayInterval, stopDisplayInterval, startLocationTracking, stopLocationTracking]);

  // --- End drive ---
  const handleEndDrive = useCallback(() => {
    stopSensors();
    stopDisplayInterval();
    stopLocationTracking();
    setIsSessionActive(false);

    const endTime = Date.now();
    const startedAt = startTimeRef.current ?? endTime;
    const durationSeconds = startTimeRef.current
      ? Math.floor((endTime - startTimeRef.current) / 1000)
      : 0;

    // Build event breakdown from the ref array (latest, not stale state)
    const eventBreakdown: Record<DriveEventType, number> = {
      HARSH_BRAKE: 0,
      HARSH_ACCEL: 0,
      SHARP_TURN: 0,
      AGGRESSIVE_STEER: 0,
      PHONE_HANDLING: 0,
      EXCESSIVE_MOVEMENT: 0,
    };

    for (const e of eventsRef.current) {
      eventBreakdown[e.type]++;
    }

    // Read score directly from ref — no stale closure, no setState side effects
    const currentScore = scoreRef.current;
    const safetyRating = getSafetyRating(currentScore);
    const summary: SessionSummary = {
      durationSeconds,
      totalEvents: eventsRef.current.length,
      eventBreakdown,
      score: currentScore,
      safetyRating,
    };

    Promise.all([
      setLastSessionSummary(summary),
      addSessionToHistory(summary, startedAt),
    ]).finally(() => {
      router.replace({
        pathname: "/SessionSummary",
        params: { summary: JSON.stringify(summary) },
      });
    });
  }, [stopSensors, stopDisplayInterval, stopLocationTracking]);

  if (sensorError) {
    return (
      <SensorErrorView
        error={sensorError}
        onBackToHome={() => router.replace("/")}
      />
    );
  }

  if (!isSessionActive) {
    return <StartingView onCancel={() => router.back()} />;
  }

  return (
    <ActiveDashboardView
      speedKmh={speedKmh}
      eventCounts={eventCounts}
      score={score}
      liveReadings={liveReadings}
      onEndDrive={handleEndDrive}
    />
  );
}
