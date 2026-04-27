/**
 * Format a stored price for UI: plain digits only (no currency symbol, code, or locale grouping).
 */
export function formatPriceNumber(value: unknown): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n)) return "—";
  if (Object.is(n, -0) || n === 0) return "0";
  if (Number.isInteger(n)) return String(n);
  const s = n.toFixed(4).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
  return s || "0";
}
