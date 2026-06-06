import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, FONT_WEIGHT } from "../constants/theme";

export default function ActiveDriveScreen() {
  const handleEndDrive = () => {
    // Navigate to SessionSummary
    router.replace("/SessionSummary");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Header with active driving badge */}
        <View style={styles.header}>
          <Text style={styles.title}>Drivewise</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>LIVE TRACKING</Text>
          </View>
        </View>

        {/* Live Score Circle Display */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>100</Text>
            <Text style={styles.scoreLabel}>Current Score</Text>
          </View>
        </View>

        {/* Live Event Counters Panel */}
        <View style={styles.countersContainer}>
          <Text style={styles.sectionTitle}>DETECTED EVENTS</Text>
          
          <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.gridRow}>
              <View style={styles.counterCard}>
                <Text style={styles.counterValue}>0</Text>
                <Text style={styles.counterLabel}>Harsh Braking</Text>
              </View>
              <View style={styles.counterCard}>
                <Text style={styles.counterValue}>0</Text>
                <Text style={styles.counterLabel}>Harsh Accel.</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.counterCard}>
                <Text style={styles.counterValue}>0</Text>
                <Text style={styles.counterLabel}>Sharp Turns</Text>
              </View>
              <View style={styles.counterCard}>
                <Text style={styles.counterValue}>0</Text>
                <Text style={styles.counterLabel}>Aggressive Steer</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.counterCard}>
                <Text style={styles.counterValue}>0</Text>
                <Text style={styles.counterLabel}>Phone Handling</Text>
              </View>
              <View style={styles.counterCard}>
                <Text style={styles.counterValue}>0</Text>
                <Text style={styles.counterLabel}>Device Sway</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Action Button Section */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.endButton} 
            onPress={handleEndDrive}
            activeOpacity={0.8}
          >
            <Text style={styles.endButtonText}>End Drive</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SPACING.lg,
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    borderColor: COLORS.accent,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  scoreValue: {
    fontSize: 54,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.text,
  },
  scoreLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    marginTop: SPACING.xs,
  },
  countersContainer: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  gridContainer: {
    gap: SPACING.md,
  },
  gridRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  counterCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
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
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  actionContainer: {
    paddingVertical: SPACING.sm,
  },
  endButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    width: "100%",
  },
  endButtonText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1,
  },
});
