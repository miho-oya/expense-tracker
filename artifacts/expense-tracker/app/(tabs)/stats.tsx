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

import { CategoryPieChart } from "@/components/CategoryPieChart";
import { MonthSummaryCard } from "@/components/MonthSummaryCard";
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
  const { monthlyBudget, categoryBudgets } = useSettings();
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

  const { breakdown, total, count } = useMemo(() => {
    const byCat = new Map<string, number>();
    let total = 0;
    let count = 0;
    for (const e of expenses) {
      if (
        getMonthKey(e.date) !== activeMonth ||
        e.currency.toUpperCase() !== "THB"
      ) {
        continue;
      }
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
      total += e.amount;
      count += 1;
    }
    const breakdown = cats
      .map((cat) => ({
        cat,
        amount: byCat.get(cat.key) ?? 0,
      }))
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    return { breakdown, total, count };
  }, [expenses, activeMonth, cats]);

  const pieSlices = useMemo(
    () =>
      breakdown.map(({ cat, amount }) => ({
        key: cat.key,
        color: cat.color,
        value: amount,
      })),
    [breakdown],
  );

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

        <MonthSummaryCard
          monthLabel={formatMonthJP(activeMonth)}
          total={total}
          count={count}
          budget={isCurrentMonth ? monthlyBudget : null}
        />

        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground, marginTop: 24 },
          ]}
        >
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
          <>
            <View
              style={[
                styles.chartCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius + 4,
                },
              ]}
            >
              <CategoryPieChart
                slices={pieSlices}
                total={total}
                size={200}
                thickness={28}
                centerSubLabel="合計"
                centerLabel={formatAmount(total, "THB")}
              />
              <View style={styles.legend}>
                {breakdown.map(({ cat, amount }) => {
                  const pct = total > 0 ? (amount / total) * 100 : 0;
                  return (
                    <View key={cat.key} style={styles.legendRow}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: cat.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.legendLabel,
                          { color: colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {cat.label}
                      </Text>
                      <Text
                        style={[
                          styles.legendPct,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {pct.toFixed(1)}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 10, marginTop: 16 }}>
              {breakdown.map(({ cat, amount }) => {
                const pct = total > 0 ? (amount / total) * 100 : 0;
                const catBudget = categoryBudgets[cat.key];
                const showBudget =
                  isCurrentMonth && catBudget != null && catBudget > 0;
                const budgetPct = showBudget
                  ? (amount / (catBudget as number)) * 100
                  : 0;
                const overBudget = showBudget && budgetPct > 100;
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
                    <View style={styles.catFooter}>
                      <Text
                        style={[
                          styles.catFooterText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        全体の {pct.toFixed(1)}%
                      </Text>
                      {showBudget && (
                        <Text
                          style={[
                            styles.catFooterText,
                            {
                              color: overBudget
                                ? colors.destructive
                                : colors.mutedForeground,
                            },
                          ]}
                        >
                          予算 {formatAmount(catBudget as number, "THB")} (
                          {Math.round(budgetPct)}%
                          {overBudget ? " 超過" : ""})
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  chartCard: {
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 18,
  },
  legend: {
    width: "100%",
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  legendPct: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
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
  catFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  catFooterText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
