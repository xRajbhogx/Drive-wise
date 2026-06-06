import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, FONT_WEIGHT } from "../../constants/theme";
import { loadHistory, invalidateCache, HistoryEntry } from "../../store/historyStore";

export default function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Reload from AsyncStorage every time the tab is focused so newly completed
  // drives appear without the user having to restart the app.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      invalidateCache();
      loadHistory().then((data) => {
        if (active) {
          setEntries([...data]); // copy so state always updates
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const handleOpenDetail = (entry: HistoryEntry) => {
    router.push({
      pathname: "/SessionSummary",
      params: { summary: JSON.stringify(entry.summary), from: "history" },
    });
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatDate = (epoch: number) => {
    const d = new Date(epoch);
    const date = d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} · ${time}`;
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Drive History</Text>
        <Text style={styles.subtitle}>
          {loading ? "Loading…" : `${entries.length} drive${entries.length !== 1 ? "s" : ""} recorded`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.text} size="large" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>◷</Text>
          <Text style={styles.emptyText}>No drives yet</Text>
          <Text style={styles.emptySubtext}>
            Complete a drive to see your history here.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {entries.map((entry, index) => {
            const { summary, startedAt } = entry;
            const ratingColor = getRatingColor(summary.safetyRating);
            const distance = (summary.durationSeconds * 0.0125).toFixed(1);

            return (
              <TouchableOpacity
                key={`${startedAt}-${index}`}
                style={styles.card}
                onPress={() => handleOpenDetail(entry)}
                activeOpacity={0.75}
              >
                {/* Top row: date + rating badge */}
                <View style={styles.cardTop}>
                  <Text style={styles.dateText}>{formatDate(startedAt)}</Text>
                  <View
                    style={[
                      styles.ratingBadge,
                      { backgroundColor: `${ratingColor}22` },
                    ]}
                  >
                    <Text style={[styles.ratingText, { color: ratingColor }]}>
                      {summary.safetyRating}
                    </Text>
                  </View>
                </View>

                {/* Score + stats row */}
                <View style={styles.statsRow}>
                  <View style={styles.scoreBlock}>
                    <Text style={[styles.scoreValue, { color: ratingColor }]}>
                      {summary.score}
                    </Text>
                    <Text style={styles.scoreMax}>/ 100</Text>
                  </View>

                  <View style={styles.dividerVertical} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {formatDuration(summary.durationSeconds)}
                    </Text>
                    <Text style={styles.statLabel}>Duration</Text>
                  </View>

                  <View style={styles.dividerVertical} />

                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{distance} km</Text>
                    <Text style={styles.statLabel}>Distance</Text>
                  </View>

                  <View style={styles.dividerVertical} />

                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statValue,
                        summary.totalEvents > 0 ? { color: COLORS.warning } : {},
                      ]}
                    >
                      {summary.totalEvents}
                    </Text>
                    <Text style={styles.statLabel}>Events</Text>
                  </View>
                </View>

                {/* Event chips — only non-zero events */}
                {summary.totalEvents > 0 && (
                  <View style={styles.breakdown}>
                    {Object.entries(summary.eventBreakdown).map(([key, count]) => {
                      if (count === 0) return null;
                      return (
                        <View key={key} style={styles.eventChip}>
                          <Text style={styles.eventChipText}>
                            {EVENT_LABELS[key] ?? key}
                          </Text>
                          <Text style={styles.eventChipCount}>{count}×</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Tap hint */}
                <Text style={styles.tapHint}>Tap to view details →</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const EVENT_LABELS: Record<string, string> = {
  HARSH_BRAKE:        "Harsh Brake",
  HARSH_ACCEL:        "Harsh Accel",
  SHARP_TURN:         "Sharp Turn",
  AGGRESSIVE_STEER:   "Agg. Steer",
  PHONE_HANDLING:     "Phone",
  EXCESSIVE_MOVEMENT: "Device Sway",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  dateText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  ratingBadge: {
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scoreBlock: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    flex: 1.2,
    justifyContent: "center",
  },
  scoreValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
  },
  scoreMax: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  dividerVertical: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  breakdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  eventChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.12)",
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    gap: 4,
  },
  eventChipText: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: FONT_WEIGHT.medium,
  },
  eventChipCount: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: FONT_WEIGHT.bold,
  },
  tapHint: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: SPACING.sm,
    letterSpacing: 0.3,
  },
});
