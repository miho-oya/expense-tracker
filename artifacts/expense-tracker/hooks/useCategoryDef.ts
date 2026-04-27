import { useMemo } from "react";

import {
  CATEGORIES,
  getCategory,
  type CategoryDef,
} from "@/constants/categories";
import {
  useSettings,
  type CategoryOverride,
} from "@/contexts/SettingsContext";

function deriveSoftBg(color: string): string {
  // hex like "#ea580c" → "#ea580c1A" (≈10% alpha) for a soft background tint
  if (color.startsWith("#") && color.length === 7) {
    return color + "1A";
  }
  return color;
}

export function applyOverride(
  base: CategoryDef,
  override?: CategoryOverride,
): CategoryDef {
  if (!override) return base;
  const result: CategoryDef = { ...base };
  if (override.label && override.label.trim()) {
    result.label = override.label;
  }
  if (override.color) {
    result.color = override.color;
    result.softBg = deriveSoftBg(override.color);
  }
  if (override.icon) {
    result.icon = override.icon as CategoryDef["icon"];
  }
  return result;
}

export function useCategoryDef(key: string): CategoryDef {
  const { categoryOverrides } = useSettings();
  return useMemo(() => {
    const base = getCategory(key);
    return applyOverride(base, categoryOverrides[base.key]);
  }, [key, categoryOverrides]);
}

export function useCategoriesList(): CategoryDef[] {
  const { categoryOverrides } = useSettings();
  return useMemo(
    () =>
      CATEGORIES.map((cat) => applyOverride(cat, categoryOverrides[cat.key])),
    [categoryOverrides],
  );
}
