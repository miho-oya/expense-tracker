import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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

import { getCategory, type CategoryKey } from "@/constants/categories";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";

const COLOR_CHOICES = [
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#9333ea",
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#0d9488",
  "#16a34a",
  "#ca8a04",
  "#525252",
  "#1f2937",
];

const ICON_CHOICES: React.ComponentProps<typeof Feather>["name"][] = [
  "coffee",
  "shopping-bag",
  "shopping-cart",
  "gift",
  "navigation",
  "truck",
  "map-pin",
  "film",
  "music",
  "headphones",
  "tv",
  "zap",
  "wifi",
  "droplet",
  "home",
  "heart",
  "activity",
  "thermometer",
  "smartphone",
  "monitor",
  "book",
  "briefcase",
  "tool",
  "credit-card",
  "dollar-sign",
  "tag",
  "star",
  "more-horizontal",
];

export default function CategoryEditScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ key?: string }>();
  const key = (params.key as CategoryKey) ?? "other";
  const base = getCategory(key);
  const { categoryOverrides, setCategoryOverride } = useSettings();
  const current = categoryOverrides[key] ?? {};

  const [label, setLabel] = useState(current.label ?? base.label);
  const [color, setColor] = useState(current.color ?? base.color);
  const [icon, setIcon] = useState<
    React.ComponentProps<typeof Feather>["name"]
  >((current.icon as React.ComponentProps<typeof Feather>["name"]) ?? base.icon);

  const handleSave = () => {
    const trimmed = label.trim();
    if (!trimmed) {
      Alert.alert("入力エラー", "名前を入力してください");
      return;
    }
    const baseDef = getCategory(key);
    const override: {
      label?: string;
      color?: string;
      icon?: string;
    } = {};
    if (trimmed !== baseDef.label) override.label = trimmed;
    if (color !== baseDef.color) override.color = color;
    if (icon !== baseDef.icon) override.icon = icon as string;

    if (Object.keys(override).length === 0) {
      setCategoryOverride(key, null);
    } else {
      setCategoryOverride(key, override);
    }
    router.back();
  };

  const handleReset = () => {
    const doReset = () => {
      setCategoryOverride(key, null);
      router.back();
    };
    if (Platform.OS === "web") {
      doReset();
      return;
    }
    Alert.alert("初期設定に戻しますか?", "このカテゴリのカスタマイズを削除します", [
      { text: "キャンセル", style: "cancel" },
      { text: "戻す", style: "destructive", onPress: doReset },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPad =
    Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16) + 8;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.headerBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.headerBtnText, { color: colors.primary }]}>
            キャンセル
          </Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          カテゴリ編集
        </Text>
        <Pressable
          onPress={handleSave}
          hitSlop={12}
          style={({ pressed }) => [
            styles.headerBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text
            style={[
              styles.headerBtnText,
              { color: colors.primary, fontFamily: "Inter_700Bold" },
            ]}
          >
            保存
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: bottomPad + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewWrap}>
          <View
            style={[
              styles.previewCircle,
              {
                backgroundColor:
                  color.startsWith("#") && color.length === 7
                    ? color + "1A"
                    : color,
              },
            ]}
          >
            <Feather name={icon} size={28} color={color} />
          </View>
          <Text style={[styles.previewLabel, { color: colors.foreground }]}>
            {label || base.label}
          </Text>
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          名前
        </Text>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder={base.label}
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
              color: colors.foreground,
            },
          ]}
        />

        <Text
          style={[
            styles.fieldLabel,
            { color: colors.mutedForeground, marginTop: 18 },
          ]}
        >
          アイコン
        </Text>
        <View
          style={[
            styles.gridCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          {ICON_CHOICES.map((iconName) => {
            const active = icon === iconName;
            return (
              <Pressable
                key={iconName}
                onPress={() => setIcon(iconName)}
                style={({ pressed }) => [
                  styles.iconCell,
                  {
                    backgroundColor: active ? color + "1A" : "transparent",
                    borderColor: active ? color : "transparent",
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Feather
                  name={iconName}
                  size={22}
                  color={active ? color : colors.foreground}
                />
              </Pressable>
            );
          })}
        </View>

        <Text
          style={[
            styles.fieldLabel,
            { color: colors.mutedForeground, marginTop: 18 },
          ]}
        >
          カラー
        </Text>
        <View
          style={[
            styles.gridCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          {COLOR_CHOICES.map((c) => {
            const active = color === c;
            return (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={({ pressed }) => [
                  styles.colorCell,
                  {
                    backgroundColor: c,
                    borderColor: active ? colors.foreground : "transparent",
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                {active && <Feather name="check" size={18} color="#ffffff" />}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.resetBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
              opacity: pressed ? 0.6 : 1,
              marginTop: 24,
            },
          ]}
        >
          <Feather name="rotate-ccw" size={16} color={colors.mutedForeground} />
          <Text
            style={[styles.resetText, { color: colors.mutedForeground }]}
          >
            初期設定に戻す
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerBtn: { minWidth: 70 },
  headerBtnText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
  },
  previewWrap: {
    alignItems: "center",
    gap: 10,
    marginVertical: 24,
  },
  previewCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
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
  gridCard: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconCell: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
  },
  colorCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resetText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
