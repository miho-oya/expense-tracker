import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useParseReceipt } from "@workspace/api-client-react";

import { AddSheet } from "@/components/AddSheet";
import { BudgetBar } from "@/components/BudgetBar";
import { ExpenseRow } from "@/components/ExpenseRow";
import { useExpenses, type Expense } from "@/contexts/ExpensesContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import {
  formatAmount,
  formatDateJP,
  getMonthKey,
  formatMonthJP,
  todayISO,
} from "@/utils/format";

type Section = {
  title: string;
  data: Expense[];
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { expenses, loaded, setDraft } = useExpenses();
  const { monthlyBudget } = useSettings();
  const parseReceipt = useParseReceipt();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [parsing, setParsing] = useState(false);

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top;

  const { sections, monthTotal, monthLabel } = useMemo(() => {
    const sorted = [...expenses].sort((a, b) =>
      a.date === b.date
        ? b.createdAt - a.createdAt
        : a.date < b.date
          ? 1
          : -1,
    );

    const grouped = new Map<string, Expense[]>();
    for (const e of sorted) {
      const list = grouped.get(e.date) ?? [];
      list.push(e);
      grouped.set(e.date, list);
    }

    const sections: Section[] = Array.from(grouped.entries()).map(
      ([date, data]) => ({
        title: formatDateJP(date),
        data,
      }),
    );

    const currentMonth = getMonthKey(todayISO());
    let monthTotal = 0;
    for (const e of expenses) {
      if (
        getMonthKey(e.date) === currentMonth &&
        e.currency.toUpperCase() === "THB"
      ) {
        monthTotal += e.amount;
      }
    }

    return {
      sections,
      monthTotal,
      monthLabel: formatMonthJP(currentMonth),
    };
  }, [expenses]);

  const handleParseImage = async (
    asset: ImagePicker.ImagePickerAsset,
  ) => {
    setParsing(true);
    try {
      const base64 = asset.base64;
      if (!base64) {
        throw new Error("画像データの読み込みに失敗しました");
      }
      const mimeType = asset.mimeType ?? "image/jpeg";
      const result = await parseReceipt.mutateAsync({
        data: { imageBase64: base64, mimeType },
      });
      setDraft({
        amount: result.amount,
        currency: result.currency,
        date: String(result.date).substring(0, 10),
        merchant: result.merchant,
        category: result.suggestedCategory,
        note: result.rawNote ?? "",
      });
      router.push("/expense");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "領収書の解析に失敗しました";
      Alert.alert("解析エラー", msg);
    } finally {
      setParsing(false);
    }
  };

  // IMPORTANT: on web, the file picker MUST be invoked synchronously from the
  // user click. Awaiting `requestMediaLibraryPermissionsAsync` first breaks the
  // user-gesture context and the file dialog never opens. Skip permission
  // checks on web (the browser handles them natively).
  const pickFromLibrary = async () => {
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "権限が必要です",
          "写真ライブラリへのアクセスを許可してください",
        );
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      handleParseImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "権限が必要です",
          "カメラへのアクセスを許可してください",
        );
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      handleParseImage(result.assets[0]);
    }
  };

  const openManual = () => {
    setDraft({
      currency: "THB",
      date: todayISO(),
      category: "other",
    });
    router.push("/expense");
  };

  const handleRowPress = (expense: Expense) => {
    setDraft(null);
    router.push({ pathname: "/expense", params: { id: expense.id } });
  };

  const openSheet = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setSheetVisible(true);
  };

  const fabBottom =
    (Platform.OS === "web" ? 84 : insets.bottom + 60) + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
          {monthLabel}の支出
        </Text>
        <Text style={[styles.totalAmount, { color: colors.foreground }]}>
          {formatAmount(monthTotal, "THB")}
        </Text>
        {monthlyBudget != null && monthlyBudget > 0 && (
          <BudgetBar spent={monthTotal} budget={monthlyBudget} />
        )}
      </View>

      {loaded && expenses.length === 0 ? (
        <View style={styles.empty}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            まだ出費がありません
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            右下のボタンから領収書のスクショを{"\n"}アップロードしてみましょう
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 14,
            paddingBottom: fabBottom + 80,
          }}
          renderSectionHeader={({ section }) => (
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: colors.background },
              ]}
            >
              <Text
                style={[
                  styles.sectionHeaderText,
                  { color: colors.mutedForeground },
                ]}
              >
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 8 }}>
              <ExpenseRow expense={item} onPress={() => handleRowPress(item)} />
            </View>
          )}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Pressable
        onPress={openSheet}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: fabBottom,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
        ]}
      >
        <Feather name="plus" size={28} color={colors.primaryForeground} />
      </Pressable>

      <AddSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onPickPhoto={pickFromLibrary}
        onTakePhoto={takePhoto}
        onManual={openManual}
      />

      <Modal visible={parsing} transparent animationType="fade">
        <View style={styles.parsingOverlay}>
          <View
            style={[
              styles.parsingBox,
              { backgroundColor: colors.card },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.parsingText, { color: colors.foreground }]}>
              領収書を読み取り中…
            </Text>
            <Text
              style={[styles.parsingHint, { color: colors.mutedForeground }]}
            >
              金額・日付・カテゴリを自動で抽出しています
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  totalAmount: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  parsingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  parsingBox: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: "center",
    gap: 12,
    minWidth: 240,
  },
  parsingText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  parsingHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
