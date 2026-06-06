import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Location from "expo-location";
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, FONT_WEIGHT } from "../constants/theme";
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
import { setLastSessionSummary } from "./index";

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
  // Uses functional state updates so no stale closure issues.
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
    setScore((prev) => Math.max(0, prev - PENALTIES[type]));

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

    // Read latest score via functional update to avoid stale closure
    setScore((currentScore) => {
      const safetyRating = getSafetyRating(currentScore);
      const summary: SessionSummary = {
        durationSeconds,
        totalEvents: eventsRef.current.length,
        eventBreakdown,
        score: currentScore,
        safetyRating,
      };

      setLastSessionSummary(summary);

      router.replace({
        pathname: "/SessionSummary",
        params: { summary: JSON.stringify(summary) },
      });

      return currentScore; // No change
    });
  }, [stopSensors, stopDisplayInterval, stopLocationTracking]);

  // --- Score color based on value ---
  const scoreColor = useMemo(() => {
    if (score >= 90) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  }, [score]);

  // --- Format helpers ---
  const fmt = (n: number) => {
    const sign = n >= 0 ? "+" : "";
    return `${sign}${n.toFixed(3)}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>Drivewise</Text>
          {isSessionActive ? (
            <View style={styles.badgeLive}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeTextLive}>LIVE</Text>
            </View>
          ) : sensorError ? (
            <View style={styles.badgeError}>
              <Text style={styles.badgeTextError}>SENSOR ERROR</Text>
            </View>
          ) : (
            <View style={styles.badgeStarting}>
              <Text style={styles.badgeTextStarting}>STARTING…</Text>
            </View>
          )}
        </View>

        {/* ── Speed bar ── */}
        <View style={styles.speedBar}>
          <View style={styles.speedBlock}>
            <Text style={styles.speedValue}>
              {speedKmh !== null ? speedKmh.toFixed(1) : "--"}
            </Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
          <View style={styles.speedDivider} />
          <View style={styles.speedBlock}>
            <Text style={styles.speedValue}>{eventsRef.current.length}</Text>
            <Text style={styles.speedUnit}>events</Text>
          </View>
          <View style={styles.speedDivider} />
          <View style={styles.speedBlock}>
            <Text style={[styles.speedValue, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.speedUnit}>score</Text>
          </View>
        </View>

        {/* ── Sensor Error State ── */}
        {sensorError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Sensors Unavailable</Text>
            <Text style={styles.errorBody}>{sensorError}</Text>
          </View>
        )}

        {/* ── Live Sensor Readings ── */}
        {isSessionActive && (
          <View style={styles.sensorPanel}>
            <Text style={styles.sectionTitle}>LIVE SENSOR READINGS</Text>

            <View style={styles.sensorRow}>
              <Text style={styles.sensorLabel}>ACCEL</Text>
              <View style={styles.sensorValues}>
                <View style={styles.sensorAxis}>
                  <Text style={styles.axisLabel}>X</Text>
                  <Text style={styles.axisValue}>{fmt(liveReadings.accel.x)}</Text>
                </View>
                <View style={styles.sensorAxis}>
                  <Text style={styles.axisLabel}>Y</Text>
                  <Text style={styles.axisValue}>{fmt(liveReadings.accel.y)}</Text>
                </View>
                <View style={styles.sensorAxis}>
                  <Text style={styles.axisLabel}>Z</Text>
                  <Text style={styles.axisValue}>{fmt(liveReadings.accel.z)}</Text>
                </View>
              </View>
              <Text style={styles.sensorUnit}>g</Text>
            </View>

            <View style={styles.sensorDivider} />

            <View style={styles.sensorRow}>
              <Text style={styles.sensorLabel}>GYRO</Text>
              <View style={styles.sensorValues}>
                <View style={styles.sensorAxis}>
                  <Text style={styles.axisLabel}>X</Text>
                  <Text style={styles.axisValue}>{fmt(liveReadings.gyro.x)}</Text>
                </View>
                <View style={styles.sensorAxis}>
                  <Text style={styles.axisLabel}>Y</Text>
                  <Text style={styles.axisValue}>{fmt(liveReadings.gyro.y)}</Text>
                </View>
                <View style={styles.sensorAxis}>
                  <Text style={styles.axisLabel}>Z</Text>
                  <Text style={styles.axisValue}>{fmt(liveReadings.gyro.z)}</Text>
                </View>
              </View>
              <Text style={styles.sensorUnit}>rad/s</Text>
            </View>

            <View style={styles.sensorDivider} />

            <View style={styles.sensorRow}>
              <Text style={styles.sensorLabel}>MOTION</Text>
              <View style={styles.sensorValues}>
                <View style={[styles.sensorAxis, { flex: 3 }]}>
                  <Text style={styles.axisLabel}>MAG</Text>
                  <Text
                    style={[
                      styles.axisValue,
                      liveReadings.motionMag >= THRESHOLDS.EXCESSIVE_MOVEMENT
                        ? { color: COLORS.error }
                        : {},
                    ]}
                  >
                    {liveReadings.motionMag.toFixed(3)}
                  </Text>
                </View>
              </View>
              <Text style={styles.sensorUnit}>m/s²</Text>
            </View>
          </View>
        )}

        {/* ── Event Counters Grid ── */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>DETECTED EVENTS</Text>

          <View style={styles.gridRow}>
            <EventCard
              label="Harsh Braking"
              count={eventCounts.HARSH_BRAKE}
              color={COLORS.warning}
            />
            <EventCard
              label="Harsh Accel."
              count={eventCounts.HARSH_ACCEL}
              color={COLORS.warning}
            />
          </View>

          <View style={styles.gridRow}>
            <EventCard
              label="Sharp Turns"
              count={eventCounts.SHARP_TURN}
              color={COLORS.warning}
            />
            <EventCard
              label="Aggressive Steer"
              count={eventCounts.AGGRESSIVE_STEER}
              color={COLORS.warning}
            />
          </View>

          <View style={styles.gridRow}>
            <EventCard
              label="Phone Handling"
              count={eventCounts.PHONE_HANDLING}
              color={COLORS.error}
            />
            <EventCard
              label="Device Sway"
              count={eventCounts.EXCESSIVE_MOVEMENT}
              color={COLORS.warning}
            />
          </View>
        </View>

        {/* ── End Drive Button ── */}
        <TouchableOpacity
          style={[styles.endButton, !isSessionActive && styles.endButtonDisabled]}
          onPress={handleEndDrive}
          activeOpacity={0.8}
          disabled={!isSessionActive}
        >
          <Text style={styles.endButtonText}>End Drive</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Sub-component: EventCard ---
interface EventCardProps {
  label: string;
  count: number;
  color: string;
}

function EventCard({ label, count, color }: EventCardProps) {
  const active = count > 0;
  return (
    <View style={[styles.counterCard, active ? { borderColor: color } : {}]}>
      <Text style={[styles.counterValue, active ? { color } : {}]}>{count}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  badgeLive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  badgeTextLive: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  badgeError: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeTextError: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.error,
    letterSpacing: 0.5,
  },
  badgeStarting: {
    backgroundColor: "rgba(160,160,160,0.15)",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeTextStarting: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },

  // Speed / stats bar
  speedBar: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: "center",
    justifyContent: "space-around",
  },
  speedBlock: {
    flex: 1,
    alignItems: "center",
  },
  speedValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.text,
  },
  speedUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  speedDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  // Error card
  errorCard: {
    backgroundColor: "rgba(255, 59, 48, 0.08)",
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  errorBody: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Sensor panel
  sensorPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  sensorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  sensorLabel: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    width: 44,
  },
  sensorValues: {
    flex: 1,
    flexDirection: "row",
  },
  sensorAxis: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  axisLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  axisValue: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  sensorUnit: {
    fontSize: 9,
    color: COLORS.textSecondary,
    width: 32,
    textAlign: "right",
  },
  sensorDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },

  // Event grid
  eventsSection: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  gridRow: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  counterCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  counterValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  counterLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 3,
    textAlign: "center",
  },

  // End button
  endButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    width: "100%",
    marginTop: SPACING.sm,
  },
  endButtonDisabled: {
    opacity: 0.45,
  },
  endButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1,
  },
});
