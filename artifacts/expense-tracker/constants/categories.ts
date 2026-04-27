import type { ComponentProps } from "react";
import type { Feather } from "@expo/vector-icons";

export type CategoryKey =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "utilities"
  | "medical"
  | "other";

export type CategoryDef = {
  key: CategoryKey;
  label: string;
  icon: ComponentProps<typeof Feather>["name"];
  color: string;
  softBg: string;
};

export const CATEGORIES: CategoryDef[] = [
  {
    key: "food",
    label: "食費",
    icon: "coffee",
    color: "#ea580c",
    softBg: "#fff7ed",
  },
  {
    key: "transport",
    label: "交通費",
    icon: "navigation",
    color: "#2563eb",
    softBg: "#eff6ff",
  },
  {
    key: "shopping",
    label: "買い物",
    icon: "shopping-bag",
    color: "#db2777",
    softBg: "#fdf2f8",
  },
  {
    key: "entertainment",
    label: "娯楽",
    icon: "film",
    color: "#9333ea",
    softBg: "#faf5ff",
  },
  {
    key: "utilities",
    label: "公共料金",
    icon: "zap",
    color: "#ca8a04",
    softBg: "#fefce8",
  },
  {
    key: "medical",
    label: "医療",
    icon: "heart",
    color: "#dc2626",
    softBg: "#fef2f2",
  },
  {
    key: "other",
    label: "その他",
    icon: "more-horizontal",
    color: "#525252",
    softBg: "#f5f5f4",
  },
];

const CATEGORY_MAP: Record<CategoryKey, CategoryDef> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.key] = cat;
    return acc;
  },
  {} as Record<CategoryKey, CategoryDef>,
);

export function getCategory(key: string | undefined | null): CategoryDef {
  if (key && key in CATEGORY_MAP) {
    return CATEGORY_MAP[key as CategoryKey];
  }
  return CATEGORY_MAP.other;
}
