import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, StyleSheet } from "react-native";

import { getCategory } from "@/constants/categories";

type Props = {
  category: string;
  size?: number;
};

export function CategoryIcon({ category, size = 44 }: Props) {
  const cat = getCategory(category);
  const iconSize = Math.round(size * 0.5);
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: cat.softBg,
        },
      ]}
    >
      <Feather name={cat.icon} size={iconSize} color={cat.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
