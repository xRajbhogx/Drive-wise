import React, { useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, FONT_WEIGHT } from "../../constants/theme";
import { DriveEventType } from "../../types";
import { THRESHOLDS } from "../../engine/thresholds";
import EventCard from "./EventCard";

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

interface ActiveDashboardViewProps {
  speedKmh: number | null;
  eventCounts: Record<DriveEventType, number>;
  score: number;
  liveReadings: LiveReadings;
  onEndDrive: () => void;
}

export default function ActiveDashboardView({
  speedKmh,
  eventCounts,
  score,
  liveReadings,
  onEndDrive,
}: ActiveDashboardViewProps) {
  // Score color based on value
  const scoreColor = useMemo(() => {
    if (score >= 90) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  }, [score]);

  // Total event count
  const totalEvents = useMemo(() => {
    return Object.values(eventCounts).reduce((a, b) => a + b, 0);
  }, [eventCounts]);

  // Format helpers
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
          <View style={styles.badgeLive}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeTextLive}>LIVE</Text>
          </View>
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
            <Text style={styles.speedValue}>{totalEvents}</Text>
            <Text style={styles.speedUnit}>events</Text>
          </View>
          <View style={styles.speedDivider} />
          <View style={styles.speedBlock}>
            <Text style={[styles.speedValue, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.speedUnit}>score</Text>
          </View>
        </View>

        {/* ── Live Sensor Readings ── */}
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
          style={styles.endButton}
          onPress={onEndDrive}
          activeOpacity={0.8}
        >
          <Text style={styles.endButtonText}>End Drive</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

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

  // End button
  endButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    width: "100%",
    marginTop: SPACING.sm,
  },
  endButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1,
  },
});
