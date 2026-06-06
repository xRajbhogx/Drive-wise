import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, FONT_WEIGHT } from "../constants/theme";

export default function HomeScreen() {
  const handleStartDrive = () => {
    router.push("/ActiveDriveScreen");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.titlePrefix}>
            DRIVE<Text style={styles.titleSuffix}>WISE</Text>
          </Text>
          <Text style={styles.tagline}>
            Analyze sensor data in real-time to track your driving safety and build better road habits.
          </Text>
        </View>

        {/* Action Button Section */}
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
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardLabel}>Safety Score</Text>
                <Text style={styles.safetyRatingText}>Excellent</Text>
              </View>
              <Text style={styles.scoreText}>95</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>18m 42s</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={styles.statValue}>2</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>5.4 km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
            </View>

            <View style={styles.eventBreakdownContainer}>
              <Text style={styles.breakdownTitle}>Event Breakdown</Text>
              <View style={styles.eventRow}>
                <Text style={styles.eventLabel}>Harsh Braking</Text>
                <Text style={styles.eventCount}>1</Text>
              </View>
              <View style={styles.eventRow}>
                <Text style={styles.eventLabel}>Excessive Movement</Text>
                <Text style={styles.eventCount}>1</Text>
              </View>
            </View>
          </View>
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
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
  scoreText: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.accent,
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
});
