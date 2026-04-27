import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BudgetBar } from "@/components/BudgetBar";
import { useExpenses } from "@/contexts/ExpensesContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useCategoriesList } from "@/hooks/useCategoryDef";
import { useColors } from "@/hooks/useColors";
import {
  formatAmount,
  formatMonthJP,
  getMonthKey,
  todayISO,
} from "@/utils/format";

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses } = useExpenses();
  const { monthlyBudget } = useSettings();
  const cats = useCategoriesList();
  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const months = useMemo(() => {
    const set = new Set<string>();
    set.add(getMonthKey(todayISO()));
    for (const e of expenses) {
      set.add(getMonthKey(e.date));
    }
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [expenses]);

  const [selectedMonth, setSelectedMonth] = useState<string>(months[0]);
  const activeMonth =
    months.includes(selectedMonth) ? selectedMonth : months[0];
  const isCurrentMonth = activeMonth === getMonthKey(todayISO());

  const { breakdown, total } = useMemo(() => {
    const byCat = new Map<string, number>();
    let total = 0;
    for (const e of expenses) {
      if (
        getMonthKey(e.date) !== activeMonth ||
        e.currency.toUpperCase() !== "THB"
      ) {
        continue;
      }
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
      total += e.amount;
    }
    const breakdown = cats
      .map((cat) => ({
        cat,
        amount: byCat.get(cat.key) ?? 0,
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return { breakdown, total };
  }, [expenses, activeMonth, cats]);

  const monthCount = useMemo(() => {
    return expenses.filter(
      (e) =>
        getMonthKey(e.date) === activeMonth &&
        e.currency.toUpperCase() === "THB",
    ).length;
  }, [expenses, activeMonth]);

  const bottomPad = Platform.OS === "web" ? 100 : insets.bottom + 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>集計</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: bottomPad,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.monthRow}
        >
          {months.map((m) => {
            const active = m === activeMonth;
            return (
              <Pressable
                key={m}
                onPress={() => setSelectedMonth(m)}
                style={({ pressed }) => [
                  styles.monthChip,
                  {
                    backgroundColor: active
                      ? colors.primary
                      : colors.secondary,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.monthChipText,
                    {
                      color: active
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                >
                  {formatMonthJP(m)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius + 4,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.totalLabel, { color: colors.mutedForeground }]}
          >
            合計支出
          </Text>
          <Text style={[styles.totalAmount, { color: colors.foreground }]}>
            {formatAmount(total, "THB")}
          </Text>
          <Text
            style={[styles.totalMeta, { color: colors.mutedForeground }]}
          >
            {monthCount}件の出費
          </Text>
          {isCurrentMonth && monthlyBudget != null && monthlyBudget > 0 && (
            <BudgetBar spent={total} budget={monthlyBudget} />
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          カテゴリ別
        </Text>

        {breakdown.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather
              name="bar-chart-2"
              size={28}
              color={colors.mutedForeground}
            />
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              この月の出費はまだありません
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {breakdown.map(({ cat, amount }) => {
              const pct = total > 0 ? (amount / total) * 100 : 0;
              return (
                <View
                  key={cat.key}
                  style={[
                    styles.catCard,
                    {
                      backgroundColor: colors.card,
                      borderRadius: colors.radius,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.catHead}>
                    <View style={styles.catLabelRow}>
                      <View
                        style={[
                          styles.catDot,
                          { backgroundColor: cat.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.catLabel,
                          { color: colors.foreground },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.catAmount,
                        { color: colors.foreground },
                      ]}
                    >
                      {formatAmount(amount, "THB")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.barBg,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: cat.color,
                          width: `${Math.max(pct, 4)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.catPct,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {pct.toFixed(1)}%
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  monthRow: {
    paddingVertical: 12,
    gap: 8,
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  monthChipText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  totalCard: {
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    marginBottom: 24,
    alignItems: "stretch",
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  totalAmount: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  totalMeta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  catCard: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  catHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  catLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  catAmount: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    fontVariant: ["tabular-nums"],
  },
  barBg: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  catPct: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    alignSelf: "flex-end",
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
