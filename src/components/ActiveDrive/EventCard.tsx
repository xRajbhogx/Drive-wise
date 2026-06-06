import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS, FONT_SIZE, SPACING, BORDER_RADIUS, FONT_WEIGHT } from "../../constants/theme";

interface EventCardProps {
  label: string;
  count: number;
  color: string;
}

export default function EventCard({ label, count, color }: EventCardProps) {
  const active = count > 0;
  return (
    <View style={[styles.counterCard, active ? { borderColor: color } : {}]}>
      <Text style={[styles.counterValue, active ? { color } : {}]}>{count}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
