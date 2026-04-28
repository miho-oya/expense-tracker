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

// Format a numeric input string with thousand separators while preserving
// the decimal portion the user is typing.
// "1234.5" -> "1,234.5", "1234." -> "1,234.", "" -> ""
export function formatNumberInput(value: string): string {
  // Strip everything that isn't a digit or a dot (also drops existing commas).
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (cleaned === "") return "";
  // Keep only the first dot.
  const firstDot = cleaned.indexOf(".");
  const intRaw =
    firstDot === -1 ? cleaned : cleaned.substring(0, firstDot);
  const decRaw =
    firstDot === -1
      ? ""
      : cleaned.substring(firstDot + 1).replace(/\./g, "");
  const intFormatted =
    intRaw === ""
      ? ""
      : Number(intRaw).toLocaleString("en-US", {
          maximumFractionDigits: 0,
        });
  if (firstDot === -1) return intFormatted;
  return `${intFormatted === "" ? "0" : intFormatted}.${decRaw}`;
}

export function parseFormattedNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}
