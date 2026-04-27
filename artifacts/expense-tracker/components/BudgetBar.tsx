import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { formatAmount } from "@/utils/format";

type Props = {
  spent: number;
  budget: number;
  currency?: string;
};

export function BudgetBar({ spent, budget, currency = "THB" }: Props) {
  const colors = useColors();
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const over = pct > 100;
  const fillColor = over ? colors.destructive : colors.primary;
  const remaining = budget - spent;

  return (
    <View style={styles.container}>
      <View style={[styles.track, { backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: fillColor,
              width: `${Math.min(pct, 100)}%`,
            },
          ]}
        />
      </View>
      <View style={styles.row}>
        <Text style={[styles.text, { color: colors.mutedForeground }]}>
          予算 {formatAmount(budget, currency)}
        </Text>
        <Text
          style={[
            styles.text,
            { color: over ? colors.destructive : colors.mutedForeground },
          ]}
        >
          {over
            ? `${formatAmount(Math.abs(remaining), currency)} 超過`
            : `残り ${formatAmount(remaining, currency)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginTop: 12,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
  },
});
