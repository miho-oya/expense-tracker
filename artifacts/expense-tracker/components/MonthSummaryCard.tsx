import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { BudgetBar } from "@/components/BudgetBar";
import { useColors } from "@/hooks/useColors";
import { formatAmount } from "@/utils/format";

type Props = {
  monthLabel: string;
  total: number;
  count: number;
  budget?: number | null;
  currency?: string;
};

export function MonthSummaryCard({
  monthLabel,
  total,
  count,
  budget,
  currency = "THB",
}: Props) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius + 4,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {monthLabel}の合計支出
      </Text>
      <Text style={[styles.amount, { color: colors.foreground }]}>
        {formatAmount(total, currency)}
      </Text>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        {count}件の出費
      </Text>
      {budget != null && budget > 0 && (
        <BudgetBar spent={total} budget={budget} currency={currency} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  amount: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  meta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
