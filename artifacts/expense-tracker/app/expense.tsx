import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { type CategoryKey } from "@/constants/categories";
import { useExpenses } from "@/contexts/ExpensesContext";
import { useCategoriesList } from "@/hooks/useCategoryDef";
import { useColors } from "@/hooks/useColors";
import { formatDateJP, todayISO } from "@/utils/format";

export default function ExpenseScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = typeof params.id === "string" ? params.id : undefined;
  const cats = useCategoriesList();

  const {
    draft,
    setDraft,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,
  } = useExpenses();

  const existing = useMemo(
    () => (editId ? getExpense(editId) : undefined),
    [editId, getExpense],
  );

  const initial = useMemo(() => {
    if (existing) {
      return {
        amount: existing.amount.toString(),
        currency: existing.currency,
        date: existing.date,
        merchant: existing.merchant,
        category: existing.category as CategoryKey,
        note: existing.note ?? "",
      };
    }
    return {
      amount:
        draft?.amount !== undefined ? String(draft.amount) : "",
      currency: draft?.currency ?? "THB",
      date: draft?.date ?? todayISO(),
      merchant: draft?.merchant ?? "",
      category: (draft?.category ?? "other") as CategoryKey,
      note: draft?.note ?? "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const [amount, setAmount] = useState(initial.amount);
  const [currency, setCurrency] = useState(initial.currency);
  const [date, setDate] = useState(initial.date);
  const [merchant, setMerchant] = useState(initial.merchant);
  const [category, setCategory] = useState<CategoryKey>(initial.category);
  const [note, setNote] = useState(initial.note);

  useEffect(() => {
    return () => {
      // clear draft when leaving
      setDraft(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    const amountNum = parseFloat(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      Alert.alert("入力エラー", "金額を正しく入力してください");
      return;
    }
    if (!merchant.trim()) {
      Alert.alert("入力エラー", "支払先を入力してください");
      return;
    }
    const payload = {
      amount: amountNum,
      currency: currency.toUpperCase() || "THB",
      date,
      merchant: merchant.trim(),
      category,
      note: note.trim(),
    };
    if (editId) {
      updateExpense(editId, payload);
    } else {
      addExpense(payload);
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    router.back();
  };

  const handleDelete = () => {
    if (!editId) return;
    const doDelete = () => {
      deleteExpense(editId);
      router.back();
    };
    if (Platform.OS === "web") {
      doDelete();
      return;
    }
    Alert.alert("削除しますか?", "この出費を削除します", [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: doDelete },
    ]);
  };

  const adjustDate = (deltaDays: number) => {
    const parts = date.split("-").map((p) => parseInt(p, 10));
    if (parts.length !== 3) return;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + deltaDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setDate(`${y}-${m}-${day}`);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPad =
    Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16) + 8;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          hitSlop={12}
        >
          <Text style={[styles.headerBtnText, { color: colors.primary }]}>
            キャンセル
          </Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {editId ? "出費を編集" : "新しい出費"}
        </Text>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.headerBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          hitSlop={12}
        >
          <Text
            style={[
              styles.headerBtnText,
              {
                color: colors.primary,
                fontFamily: "Inter_700Bold",
              },
            ]}
          >
            保存
          </Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: bottomPad + 32,
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.amountCard,
            {
              backgroundColor: colors.card,
              borderRadius: colors.radius + 4,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[styles.amountLabel, { color: colors.mutedForeground }]}
          >
            金額
          </Text>
          <View style={styles.amountRow}>
            <TextInput
              value={currency}
              onChangeText={(v) => setCurrency(v.toUpperCase().slice(0, 4))}
              autoCapitalize="characters"
              maxLength={4}
              style={[
                styles.currencyInput,
                {
                  color: colors.mutedForeground,
                  borderColor: colors.border,
                },
              ]}
            />
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.amountInput,
                { color: colors.foreground },
              ]}
            />
          </View>
        </View>

        <Field label="支払先">
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            placeholder="例: セブンイレブン"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          />
        </Field>

        <Field label="日付">
          <View
            style={[
              styles.dateRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Pressable
              onPress={() => adjustDate(-1)}
              style={({ pressed }) => [
                styles.dateBtn,
                { opacity: pressed ? 0.5 : 1 },
              ]}
              hitSlop={8}
            >
              <Feather
                name="chevron-left"
                size={20}
                color={colors.foreground}
              />
            </Pressable>
            <Text
              style={[styles.dateText, { color: colors.foreground }]}
            >
              {formatDateJP(date)}
            </Text>
            <Pressable
              onPress={() => adjustDate(1)}
              style={({ pressed }) => [
                styles.dateBtn,
                { opacity: pressed ? 0.5 : 1 },
              ]}
              hitSlop={8}
            >
              <Feather
                name="chevron-right"
                size={20}
                color={colors.foreground}
              />
            </Pressable>
          </View>
        </Field>

        <Field label="カテゴリ">
          <View style={styles.catGrid}>
            {cats.map((cat) => {
              const active = cat.key === category;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => {
                    setCategory(cat.key);
                    if (Platform.OS !== "web") {
                      Haptics.selectionAsync().catch(() => {});
                    }
                  }}
                  style={({ pressed }) => [
                    styles.catChip,
                    {
                      backgroundColor: active ? cat.color : colors.card,
                      borderColor: active ? cat.color : colors.border,
                      borderRadius: colors.radius,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Feather
                    name={cat.icon}
                    size={16}
                    color={active ? "#ffffff" : cat.color}
                  />
                  <Text
                    style={[
                      styles.catChipText,
                      {
                        color: active ? "#ffffff" : colors.foreground,
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        <Field label="メモ">
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="任意"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.noteInput,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          />
        </Field>

        {editId && (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteBtn,
              {
                borderRadius: colors.radius,
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Feather name="trash-2" size={18} color={colors.destructive} />
            <Text
              style={[styles.deleteText, { color: colors.destructive }]}
            >
              この出費を削除
            </Text>
          </Pressable>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: {
    minWidth: 70,
  },
  headerBtnText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
  amountCard: {
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 6,
    marginBottom: 18,
  },
  amountLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currencyInput: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    minWidth: 60,
    textAlign: "center",
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
    paddingVertical: 4,
  },
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    borderWidth: StyleSheet.hairlineWidth,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  catChipText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
  },
  deleteText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
