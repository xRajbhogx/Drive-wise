import React, { useState, useCallback } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, FONT_WEIGHT } from "../../constants/theme";
import { getLastSessionSummary } from "../../store/historyStore";
import { SessionSummary } from "../../types";

export default function HomeScreen() {
  const [lastSession, setLastSession] = useState<SessionSummary | null>(null);

  // Refresh last session every time this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLastSessionSummary().then((summary) => {
        if (active) {
          setLastSession(summary);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const handleStartDrive = () => {
    router.push("/ActiveDriveScreen");
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
      case "Good":
        return COLORS.success;
      case "Fair":
        return COLORS.warning;
      default:
        return COLORS.error;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "HARSH_BRAKE":         return "Harsh Braking";
      case "HARSH_ACCEL":         return "Harsh Acceleration";
      case "SHARP_TURN":          return "Sharp Turns";
      case "AGGRESSIVE_STEER":    return "Aggressive Steering";
      case "PHONE_HANDLING":      return "Phone Handling";
      case "EXCESSIVE_MOVEMENT":  return "Excessive Movement";
      default:                    return type;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titlePrefix}>
            DRIVE<Text style={styles.titleSuffix}>WISE</Text>
          </Text>
          <Text style={styles.tagline}>
            Analyze sensor data in real-time to track your driving safety and build better road habits.
          </Text>
        </View>

        {/* Start Drive Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartDrive}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Start Drive</Text>
          </TouchableOpacity>
        </View>

        {/* Last Session Card */}
        <View style={styles.lastSessionContainer}>
          <Text style={styles.sectionTitle}>LAST DRIVE SUMMARY</Text>

          {lastSession ? (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardLabel}>Safety Score</Text>
                  <Text style={[styles.safetyRatingText, { color: getRatingColor(lastSession.safetyRating) }]}>
                    {lastSession.safetyRating}
                  </Text>
                </View>
                <Text style={[styles.scoreText, { color: getRatingColor(lastSession.safetyRating) }]}>
                  {lastSession.score}
                </Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatDuration(lastSession.durationSeconds)}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{lastSession.totalEvents}</Text>
                  <Text style={styles.statLabel}>Events</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{(lastSession.durationSeconds * 0.0125).toFixed(1)} km</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
              </View>

              {lastSession.totalEvents > 0 && (
                <View style={styles.eventBreakdownContainer}>
                  <Text style={styles.breakdownTitle}>Event Breakdown</Text>
                  {Object.entries(lastSession.eventBreakdown).map(([key, count]) => {
                    if (count === 0) return null;
                    return (
                      <View key={key} style={styles.eventRow}>
                        <Text style={styles.eventLabel}>{getEventLabel(key)}</Text>
                        <Text style={styles.eventCount}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No drives recorded yet.</Text>
              <Text style={styles.emptySubtext}>
                Your safety summary will appear here after you finish a drive.
              </Text>
            </View>
          )}
        </View>

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
    justifyContent: "space-between",
  },
  header: {
    marginTop: SPACING.xl,
    alignItems: "center",
  },
  titlePrefix: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    letterSpacing: 2,
  },
  titleSuffix: {
    color: COLORS.accent,
  },
  tagline: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.md,
    lineHeight: 22,
    paddingHorizontal: SPACING.sm,
  },
  actionContainer: {
    marginVertical: SPACING.xl,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.full,
    width: "100%",
    alignItems: "center",
  },
  startButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1,
  },
  lastSessionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  safetyRatingText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginTop: SPACING.xs,
  },
  scoreText: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  eventBreakdownContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  breakdownTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  eventRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: SPACING.xs,
  },
  eventLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  eventCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: "center",
    lineHeight: 18,
  },
});
