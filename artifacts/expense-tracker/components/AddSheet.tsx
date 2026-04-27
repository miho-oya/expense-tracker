import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPickPhoto: () => void;
  onTakePhoto: () => void;
  onManual: () => void;
};

export function AddSheet({
  visible,
  onClose,
  onPickPhoto,
  onTakePhoto,
  onManual,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pendingFnRef = useRef<(() => void) | null>(null);

  const runPending = () => {
    const f = pendingFnRef.current;
    pendingFnRef.current = null;
    if (f) f();
  };

  // Sequencing rules per platform:
  //   - Web: file picker MUST be invoked synchronously inside the user click
  //     to preserve the gesture context, otherwise the dialog never opens.
  //   - iOS: only one modal can be presented at a time. We must wait until the
  //     sheet's dismiss animation fully finishes before launching the image
  //     picker, otherwise UIImagePickerController silently fails to present.
  //     Modal's `onDismiss` (iOS-only) fires exactly when that completes.
  //   - Android: `onDismiss` is unsupported on RN's Modal, so we fall back to
  //     a short timeout that exceeds the fade animation.
  const handle = (fn: () => void) => () => {
    if (Platform.OS === "web") {
      fn();
      onClose();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    pendingFnRef.current = fn;
    onClose();
    if (Platform.OS === "android") {
      setTimeout(runPending, 320);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={runPending}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: bottomPad,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handleBar}>
            <View
              style={[
                styles.handle,
                { backgroundColor: colors.border },
              ]}
            />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            出費を追加
          </Text>

          <Action
            icon="image"
            label="写真から読み取り"
            sublabel="銀行アプリの領収書スクショを選択"
            color={colors.primary}
            onPress={handle(onPickPhoto)}
          />
          {Platform.OS !== "web" && (
            <Action
              icon="camera"
              label="カメラで撮影"
              sublabel="その場で領収書を撮影"
              color={colors.primary}
              onPress={handle(onTakePhoto)}
            />
          )}
          <Action
            icon="edit-3"
            label="手動で入力"
            sublabel="金額やカテゴリを直接入力"
            color={colors.mutedForeground}
            onPress={handle(onManual)}
          />
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancel,
              {
                backgroundColor: colors.secondary,
                borderRadius: colors.radius,
                opacity: pressed ? 0.7 : 1,
                marginTop: 12,
              },
            ]}
          >
            <Text style={[styles.cancelText, { color: colors.foreground }]}>
              キャンセル
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Action({
  icon,
  label,
  sublabel,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sublabel: string;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: colors.secondary },
        ]}
      >
        <Feather name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text
          style={[styles.actionSub, { color: colors.mutedForeground }]}
        >
          {sublabel}
        </Text>
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color={colors.mutedForeground}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handleBar: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  actionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  cancel: {
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
