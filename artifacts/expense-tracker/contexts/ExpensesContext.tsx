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

export type Expense = {
  id: string;
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  category: CategoryKey;
  note?: string;
  createdAt: number;
};

export type DraftExpense = {
  amount?: number;
  currency?: string;
  date?: string;
  merchant?: string;
  category?: CategoryKey;
  note?: string;
};

const STORAGE_KEY = "@expense-tracker/expenses/v1";

type ContextValue = {
  expenses: Expense[];
  loaded: boolean;
  draft: DraftExpense | null;
  setDraft: (draft: DraftExpense | null) => void;
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Expense;
  updateExpense: (
    id: string,
    expense: Omit<Expense, "id" | "createdAt">,
  ) => void;
  deleteExpense: (id: string) => void;
  getExpense: (id: string) => Expense | undefined;
};

const ExpensesContext = createContext<ContextValue | null>(null);

function genId() {
  return Date.now().toString() + Math.random().toString(36).substring(2, 11);
}

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<DraftExpense | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as Expense[];
          if (Array.isArray(parsed)) {
            setExpenses(parsed);
          }
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)).catch(() => {
      // ignore write failure
    });
  }, [expenses, loaded]);

  const addExpense = useCallback(
    (expense: Omit<Expense, "id" | "createdAt">) => {
      const newExpense: Expense = {
        ...expense,
        id: genId(),
        createdAt: Date.now(),
      };
      setExpenses((prev) => [newExpense, ...prev]);
      return newExpense;
    },
    [],
  );

  const updateExpense = useCallback(
    (id: string, expense: Omit<Expense, "id" | "createdAt">) => {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...expense } : e)),
      );
    },
    [],
  );

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getExpense = useCallback(
    (id: string) => expenses.find((e) => e.id === id),
    [expenses],
  );

  const value = useMemo<ContextValue>(
    () => ({
      expenses,
      loaded,
      draft,
      setDraft,
      addExpense,
      updateExpense,
      deleteExpense,
      getExpense,
    }),
    [
      expenses,
      loaded,
      draft,
      addExpense,
      updateExpense,
      deleteExpense,
      getExpense,
    ],
  );

  return (
    <ExpensesContext.Provider value={value}>
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpensesProvider");
  return ctx;
}
