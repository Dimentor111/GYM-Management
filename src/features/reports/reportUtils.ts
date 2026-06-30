/** Aggregation helpers for the Reports page (and dashboard breakdowns). */
import type { Sale, SaleItem } from '../../types';

export interface GroupTotal {
  qty: number;
  total: number;
}

/** Minimal shape a void/return adjustment needs for netting. */
export interface AdjustmentLike {
  total: number;
  payment_method?: string | null;
  staff_name?: string | null;
}

/** A line item still counts toward sales unless voided/returned. */
export function isActiveSaleItem(item: { status?: string | null }): boolean {
  return (item.status ?? 'active') === 'active';
}

/** Sum the line totals of a set of items (e.g. the returns/voids deduction). */
export function sumItemTotals(items: { total: number }[]): number {
  return items.reduce((sum, i) => sum + i.total, 0);
}

/** Sum line items into `{ category|product: { qty, total } }`. */
export function groupItems(items: SaleItem[], key: 'category' | 'product_name'): Record<string, GroupTotal> {
  const out: Record<string, GroupTotal> = {};
  for (const i of items) {
    const k = (i[key] as string) || '—';
    if (!out[k]) out[k] = { qty: 0, total: 0 };
    out[k].qty += i.qty;
    out[k].total += i.total;
  }
  return out;
}

/** Sum sale totals keyed by payment method. */
export function sumByPayment(sales: Sale[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sales) {
    const k = s.payment_method || '—';
    out[k] = (out[k] || 0) + s.final_total;
  }
  return out;
}

/** Sum sale totals keyed by staff member. */
export function sumByStaff(sales: Sale[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of sales) {
    const k = s.staff_name || 'Unknown';
    out[k] = (out[k] || 0) + s.final_total;
  }
  return out;
}

export function totalIncome(sales: Sale[]): number {
  return sales.reduce((sum, s) => sum + s.final_total, 0);
}

/** Gross payment totals minus voided/returned items attributed to each method. */
export function netByPayment(sales: Sale[], adjustments: AdjustmentLike[]): Record<string, number> {
  const out = sumByPayment(sales);
  for (const a of adjustments) {
    const k = a.payment_method || '—';
    out[k] = (out[k] || 0) - a.total;
  }
  return out;
}

/** Gross staff totals minus voided/returned items attributed to each staff member. */
export function netByStaff(sales: Sale[], adjustments: AdjustmentLike[]): Record<string, number> {
  const out = sumByStaff(sales);
  for (const a of adjustments) {
    const k = a.staff_name || 'Unknown';
    out[k] = (out[k] || 0) - a.total;
  }
  return out;
}

/** Sorted `[name, group]` pairs, descending by revenue. */
export function sortedByRevenue(groups: Record<string, GroupTotal>): [string, GroupTotal][] {
  return Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
}
