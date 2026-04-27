export function formatAmount(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const symbol = code === "THB" ? "฿" : code === "JPY" ? "¥" : code === "USD" ? "$" : "";
  const fractionDigits = code === "JPY" ? 0 : 2;
  const formatted = amount.toLocaleString("ja-JP", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  if (symbol) {
    return `${symbol}${formatted}`;
  }
  return `${formatted} ${code}`;
}

export function formatDateJP(isoDate: string): string {
  // isoDate: YYYY-MM-DD
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}

export function formatDateShort(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const [, m, d] = parts;
  return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getMonthKey(isoDate: string): string {
  return isoDate.substring(0, 7); // YYYY-MM
}

export function formatMonthJP(monthKey: string): string {
  const parts = monthKey.split("-");
  if (parts.length !== 2) return monthKey;
  const [y, m] = parts;
  return `${y}年${parseInt(m, 10)}月`;
}
