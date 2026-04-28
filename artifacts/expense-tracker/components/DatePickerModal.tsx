import { Feather } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onClose: () => void;
  onChange: (date: string) => void;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseISO(s: string): { year: number; month: number; day: number } {
  const parts = s.split("-").map((p) => parseInt(p, 10));
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function buildMonthGrid(year: number, month: number): number[] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: number[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(0);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(0);
  return cells;
}

export function DatePickerModal({ visible, value, onClose, onChange }: Props) {
  const colors = useColors();
  const initial = useMemo(() => parseISO(value), [value]);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  useEffect(() => {
    if (visible) {
      const p = parseISO(value);
      setYear(p.year);
      setMonth(p.month);
      setDay(p.day);
    }
  }, [visible, value]);

  // Clamp the day if month/year change reduces the available days.
  useEffect(() => {
    const maxDay = new Date(year, month, 0).getDate();
    if (day > maxDay) setDay(maxDay);
  }, [year, month, day]);

  const days = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const stepMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const confirm = () => {
    onChange(`${year}-${pad(month)}-${pad(day)}`);
    onClose();
  };

  const setToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setDay(now.getDate());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.card,
            { backgroundColor: colors.card, borderRadius: 16 },
          ]}
        >
          <View
            style={[styles.navRow, { borderBottomColor: colors.border }]}
          >
            <Pressable
              onPress={() => setYear((y) => y - 1)}
              style={({ pressed }) => [
                styles.navBtn,
                { backgroundColor: colors.secondary, opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={6}
            >
              <Feather
                name="chevron-left"
                size={20}
                color={colors.foreground}
              />
            </Pressable>
            <Text style={[styles.navTitle, { color: colors.foreground }]}>
              {year}年
            </Text>
            <Pressable
              onPress={() => setYear((y) => y + 1)}
              style={({ pressed }) => [
                styles.navBtn,
                { backgroundColor: colors.secondary, opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={6}
            >
              <Feather
                name="chevron-right"
                size={20}
                color={colors.foreground}
              />
            </Pressable>
          </View>

          <View style={styles.navRow}>
            <Pressable
              onPress={() => stepMonth(-1)}
              style={({ pressed }) => [
                styles.navBtn,
                { backgroundColor: colors.secondary, opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={6}
            >
              <Feather
                name="chevron-left"
                size={20}
                color={colors.foreground}
              />
            </Pressable>
            <Text style={[styles.navTitle, { color: colors.foreground }]}>
              {month}月
            </Text>
            <Pressable
              onPress={() => stepMonth(1)}
              style={({ pressed }) => [
                styles.navBtn,
                { backgroundColor: colors.secondary, opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={6}
            >
              <Feather
                name="chevron-right"
                size={20}
                color={colors.foreground}
              />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, idx) => (
              <View key={w} style={styles.weekCell}>
                <Text
                  style={[
                    styles.weekText,
                    {
                      color:
                        idx === 0
                          ? colors.destructive
                          : idx === 6
                            ? colors.primary
                            : colors.mutedForeground,
                    },
                  ]}
                >
                  {w}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((d, i) => {
              if (d === 0) {
                return <View key={i} style={styles.dayCell} />;
              }
              const active = d === day;
              const dow = i % 7;
              return (
                <Pressable
                  key={i}
                  onPress={() => setDay(d)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    {
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                  hitSlop={2}
                >
                  <View
                    style={[
                      styles.dayInner,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: active
                            ? colors.primaryForeground
                            : dow === 0
                              ? colors.destructive
                              : dow === 6
                                ? colors.primary
                                : colors.foreground,
                        },
                      ]}
                    >
                      {d}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.btnRow, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.btn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={6}
            >
              <Text
                style={[styles.btnText, { color: colors.mutedForeground }]}
              >
                キャンセル
              </Text>
            </Pressable>
            <Pressable
              onPress={setToday}
              style={({ pressed }) => [
                styles.btn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={6}
            >
              <Text style={[styles.btnText, { color: colors.foreground }]}>
                今日
              </Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              style={({ pressed }) => [
                styles.btn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              hitSlop={6}
            >
              <Text
                style={[
                  styles.btnText,
                  {
                    color: colors.primary,
                    fontFamily: "Inter_700Bold",
                  },
                ]}
              >
                完了
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    paddingVertical: 12,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
  },
  weekRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  weekCell: {
    flex: 1,
    alignItems: "center",
  },
  weekText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  dayInner: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    fontVariant: ["tabular-nums"],
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
