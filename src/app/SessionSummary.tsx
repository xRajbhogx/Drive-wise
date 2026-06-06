import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, FONT_WEIGHT } from "../constants/theme";
import { SessionSummary } from "../types";
import { PENALTIES } from "../engine/scoreEngine";

export default function SessionSummaryScreen() {
  const params = useLocalSearchParams<{ summary?: string; from?: string }>();

  const fromHistory = params.from === "history";

  const handleBack = () => {
    if (fromHistory) {
      router.back();
    } else {
      router.replace("/");
    }
  };
  
  let summary: SessionSummary | null = null;
  try {
    if (params.summary) {
      summary = JSON.parse(params.summary);
    }
  } catch (e) {
    console.error("Failed to parse driving session summary:", e);
  }

  const finalScore = summary ? summary.score : 0;
  const safetyRating = summary ? summary.safetyRating : "Poor";
  const totalEventsCount = summary ? summary.totalEvents : 0;

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };
  const duration = summary ? formatDuration(summary.durationSeconds) : "24m 15s";
  const distance = summary ? `${(summary.durationSeconds * 0.0125).toFixed(1)} km` : "8.2 km";

  const breakdownCounts = summary?.eventBreakdown || {
    HARSH_BRAKE: 0,
    HARSH_ACCEL: 0,
    SHARP_TURN: 0,
    AGGRESSIVE_STEER: 0,
    PHONE_HANDLING: 0,
    EXCESSIVE_MOVEMENT: 0,
  };

  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case "Excellent":
      case "Good":     return COLORS.success;
      case "Fair":     return COLORS.warning;
      default:         return COLORS.error;
    }
  };

  const ratingColor = getRatingColor(safetyRating);

  const eventBreakdown = [
    { name: "Harsh Braking", count: breakdownCounts.HARSH_BRAKE, penalty: -PENALTIES.HARSH_BRAKE },
    { name: "Harsh Acceleration", count: breakdownCounts.HARSH_ACCEL, penalty: -PENALTIES.HARSH_ACCEL },
    { name: "Sharp Turns", count: breakdownCounts.SHARP_TURN, penalty: -PENALTIES.SHARP_TURN },
    { name: "Aggressive Steering", count: breakdownCounts.AGGRESSIVE_STEER, penalty: -PENALTIES.AGGRESSIVE_STEER },
    { name: "Phone Handling", count: breakdownCounts.PHONE_HANDLING, penalty: -PENALTIES.PHONE_HANDLING },
    { name: "Excessive Movement", count: breakdownCounts.EXCESSIVE_MOVEMENT, penalty: -PENALTIES.EXCESSIVE_MOVEMENT },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Drive Summary</Text>
          <Text style={styles.headerSubtitle}>Excellent job focusing on safety today.</Text>
        </View>

        {/* Score & Rating Panel */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>DRIVING SAFETY SCORE</Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreValue, { color: ratingColor }]}>{finalScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          <View style={[styles.ratingBadge, { backgroundColor: `${ratingColor}22` }]}>
            <Text style={[styles.ratingText, { color: ratingColor }]}>{safetyRating}</Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{duration}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statValue}>{distance}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>TOTAL EVENTS</Text>
            <Text style={[styles.statValue, totalEventsCount > 0 ? { color: COLORS.warning } : {}]}>
              {totalEventsCount}
            </Text>
          </View>
        </View>

        {/* Event Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.sectionTitle}>EVENT BREAKDOWN</Text>
          <View style={styles.breakdownCard}>
            {eventBreakdown.map((event, index) => (
              <View key={event.name}>
                <View style={styles.eventRow}>
                  <View>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventPenalty}>{event.penalty} pts per event</Text>
                  </View>
                  <View style={styles.eventCountBadge}>
                    <Text style={[
                      styles.eventCountText,
                      event.count > 0 ? styles.activeEventText : styles.zeroEventText
                    ]}>
                      {event.count}
                    </Text>
                  </View>
                </View>
                {index < eventBreakdown.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Home Button */}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>
            {fromHistory ? "← Back to History" : "Return to Home"}
          </Text>
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
  container: {
    padding: SPACING.lg,
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  scoreCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  scoreLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginVertical: SPACING.sm,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.accent,
  },
  scoreMax: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  ratingBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  ratingText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    height: "80%",
    alignSelf: "center",
  },
  breakdownContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  breakdownCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  eventName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  eventPenalty: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  eventCountBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventCountText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  activeEventText: {
    color: COLORS.warning,
  },
  zeroEventText: {
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  homeButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: SPACING.md,
  },
  homeButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1,
  },
});
