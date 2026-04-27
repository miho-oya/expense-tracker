import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { CategoryIcon } from "@/components/CategoryIcon";
import type { Expense } from "@/contexts/ExpensesContext";
import { useCategoryDef } from "@/hooks/useCategoryDef";
import { useColors } from "@/hooks/useColors";
import { formatAmount, formatDateShort } from "@/utils/format";

type Props = {
  expense: Expense;
  onPress: () => void;
};

export function ExpenseRow({ expense, onPress }: Props) {
  const colors = useColors();
  const cat = useCategoryDef(expense.category);

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <CategoryIcon category={expense.category} size={44} />
      <View style={styles.middle}>
        <Text
          style={[styles.merchant, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {expense.merchant || cat.label}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {cat.label} · {formatDateShort(expense.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: colors.foreground }]}>
        {formatAmount(expense.amount, expense.currency)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  merchant: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  amount: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
});
