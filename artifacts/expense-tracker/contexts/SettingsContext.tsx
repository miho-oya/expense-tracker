import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { CategoryKey } from "@/constants/categories";

export type CategoryOverride = {
  label?: string;
  color?: string;
  icon?: string;
};

export type CategoryOverrides = Partial<Record<CategoryKey, CategoryOverride>>;

export type CategoryBudgets = Partial<Record<CategoryKey, number>>;

type Settings = {
  monthlyBudget: number | null;
  categoryOverrides: CategoryOverrides;
  categoryBudgets: CategoryBudgets;
};

type ContextValue = Settings & {
  loaded: boolean;
  setMonthlyBudget: (v: number | null) => void;
  setCategoryOverride: (
    key: CategoryKey,
    override: CategoryOverride | null,
  ) => void;
  setCategoryBudget: (key: CategoryKey, budget: number | null) => void;
};

const STORAGE_KEY = "@expense-tracker/settings/v1";

const DEFAULT_SETTINGS: Settings = {
  monthlyBudget: null,
  categoryOverrides: {},
  categoryBudgets: {},
};

const SettingsContext = createContext<ContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch {
        // ignore corrupt storage
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, loaded]);

  const setMonthlyBudget = useCallback((v: number | null) => {
    setSettings((prev) => ({ ...prev, monthlyBudget: v }));
  }, []);

  const setCategoryOverride = useCallback(
    (key: CategoryKey, override: CategoryOverride | null) => {
      setSettings((prev) => {
        const next: CategoryOverrides = { ...prev.categoryOverrides };
        if (override === null) {
          delete next[key];
        } else {
          next[key] = override;
        }
        return { ...prev, categoryOverrides: next };
      });
    },
    [],
  );

  const setCategoryBudget = useCallback(
    (key: CategoryKey, budget: number | null) => {
      setSettings((prev) => {
        const next: CategoryBudgets = { ...prev.categoryBudgets };
        if (budget === null || !Number.isFinite(budget) || budget <= 0) {
          delete next[key];
        } else {
          next[key] = budget;
        }
        return { ...prev, categoryBudgets: next };
      });
    },
    [],
  );

  const value = useMemo<ContextValue>(
    () => ({
      ...settings,
      loaded,
      setMonthlyBudget,
      setCategoryOverride,
      setCategoryBudget,
    }),
    [
      settings,
      loaded,
      setMonthlyBudget,
      setCategoryOverride,
      setCategoryBudget,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
