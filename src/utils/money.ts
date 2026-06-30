/** Money formatting and parsing. */

/** Format a number as `<currency><amount>` with 2 decimals, e.g. `€38.00`. */
export function formatMoney(n: number, currency = '€'): string {
  return currency + Number(n || 0).toFixed(2);
}

/** Parse a free-text numeric input to a number, defaulting to 0. */
export function parseAmount(v: string | number | null | undefined): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Compute the discount amount given a subtotal.
 * Percentage discounts scale with the subtotal; fixed discounts are capped at
 * the subtotal so the total never goes negative.
 */
export function discountAmount(subtotal: number, discount: number, type: 'pct' | 'fixed'): number {
  return type === 'pct' ? (subtotal * discount) / 100 : Math.min(discount, subtotal);
}

/** Profit margin as a whole-number percentage, or null when no cost is set. */
export function profitMargin(salePrice: number, costPrice: number): number | null {
  if (!costPrice || costPrice <= 0 || !salePrice) return null;
  return Math.round((1 - costPrice / salePrice) * 100);
}
