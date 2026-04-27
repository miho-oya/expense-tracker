import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

export type PieSlice = {
  key: string;
  value: number;
  color: string;
};

type Props = {
  slices: PieSlice[];
  total: number;
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
};

export function CategoryPieChart({
  slices,
  total,
  size = 200,
  thickness = 28,
  centerLabel,
  centerSubLabel,
}: Props) {
  const colors = useColors();
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - thickness / 2;

  const positive = slices.filter((s) => s.value > 0);
  const hasData = total > 0 && positive.length > 0;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {!hasData && (
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={colors.secondary}
            strokeWidth={thickness}
            fill="none"
          />
        )}
        {hasData && positive.length === 1 && (
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={positive[0].color}
            strokeWidth={thickness}
            fill="none"
          />
        )}
        {hasData &&
          positive.length > 1 &&
          (() => {
            let cum = -Math.PI / 2;
            const gap = 0.012; // tiny radial gap between slices
            return positive.map((s, idx) => {
              const angle = (s.value / total) * Math.PI * 2;
              const startAngle = cum + gap / 2;
              const endAngle = cum + angle - gap / 2;
              cum += angle;
              if (endAngle <= startAngle) return null;
              const x1 = cx + radius * Math.cos(startAngle);
              const y1 = cy + radius * Math.sin(startAngle);
              const x2 = cx + radius * Math.cos(endAngle);
              const y2 = cy + radius * Math.sin(endAngle);
              const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
              const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
              return (
                <Path
                  key={`${s.key}-${idx}`}
                  d={d}
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeLinecap="butt"
                  fill="none"
                />
              );
            });
          })()}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        {centerSubLabel && (
          <Text
            style={[styles.centerSub, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {centerSubLabel}
          </Text>
        )}
        {centerLabel && (
          <Text
            style={[styles.centerLabel, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {centerLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  centerLabel: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontVariant: ["tabular-nums"],
  },
});
