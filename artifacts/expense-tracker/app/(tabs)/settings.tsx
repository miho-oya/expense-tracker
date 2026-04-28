import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryIcon } from "@/components/CategoryIcon";
import { useSettings } from "@/contexts/SettingsContext";
import { useCategoriesList } from "@/hooks/useCategoryDef";
import { useColors } from "@/hooks/useColors";
import {
  formatAmount,
  formatNumberInput,
  parseFormattedNumber,
} from "@/utils/format";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { monthlyBudget, categoryBudgets, setMonthlyBudget } = useSettings();
  const cats = useCategoriesList();

  const [budgetInput, setBudgetInput] = useState(
    monthlyBudget != null ? formatNumberInput(String(monthlyBudget)) : "",
  );

  useEffect(() => {
    setBudgetInput(
      monthlyBudget != null ? formatNumberInput(String(monthlyBudget)) : "",
    );
  }, [monthlyBudget]);

  const handleBudgetChange = (text: string) => {
    setBudgetInput(formatNumberInput(text));
  };

  const commitBudget = () => {
    if (budgetInput.trim() === "") {
      setMonthlyBudget(null);
      return;
    }
    const num = parseFormattedNumber(budgetInput);
    if (num == null || num < 0) {
      Alert.alert("入力エラー", "正しい金額を入力してください");
      setBudgetInput(
        monthlyBudget != null ? formatNumberInput(String(monthlyBudget)) : "",
      );
      return;
    }
    setMonthlyBudget(num);
  };

  const clearBudget = () => {
    setMonthlyBudget(null);
    setBudgetInput("");
  };

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 100 : insets.bottom + 80;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>設定</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: bottomPad,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[styles.sectionLabel, { color: colors.mutedForeground }]}
        >
          月次予算 (THB)
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View style={styles.budgetRow}>
            <Text style={[styles.budgetSymbol, { color: colors.foreground }]}>
              ฿
            </Text>
            <TextInput
              value={budgetInput}
              onChangeText={handleBudgetChange}
              onEndEditing={commitBudget}
              onBlur={commitBudget}
              keyboardType="decimal-pad"
              placeholder="予算なし"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.budgetInput, { color: colors.foreground }]}
              returnKeyType="done"
            />
            {monthlyBudget != null && (
              <Pressable
                onPress={clearBudget}
                hitSlop={10}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
              >
                <Feather name="x-circle" size={20} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            月の支出予算を入力すると、履歴と集計に進捗バーが表示されます
          </Text>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, marginTop: 24 },
          ]}
        >
          カテゴリ
        </Text>
        <View
          style={[
            styles.catList,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          {cats.map((cat, idx) => {
            const catBudget = categoryBudgets[cat.key];
            return (
              <Pressable
                key={cat.key}
                onPress={() =>
                  router.push({
                    pathname: "/category-edit",
                    params: { key: cat.key },
                  })
                }
                style={({ pressed }) => [
                  styles.catRow,
                  {
                    borderTopColor: colors.border,
                    borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <CategoryIcon category={cat.key} size={36} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.catLabel, { color: colors.foreground }]}
                  >
                    {cat.label}
                  </Text>
                  {catBudget != null && (
                    <Text
                      style={[
                        styles.catBudget,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      予算 {formatAmount(catBudget, "THB")}
                    </Text>
                  )}
                </View>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.hint, { color: colors.mutedForeground, marginTop: 8, paddingHorizontal: 4 }]}>
          各カテゴリの名前・アイコン・色・予算をカスタマイズできます
        </Text>
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
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  budgetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  budgetSymbol: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
  },
  budgetInput: {
    flex: 1,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
    paddingVertical: 4,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  catList: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  catLabel: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  catBudget: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
});
