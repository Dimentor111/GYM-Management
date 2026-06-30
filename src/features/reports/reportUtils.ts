/** Aggregation helpers for the Reports page (and dashboard breakdowns). */
import type { Sale, SaleItem } from '../../types';

export interface GroupTotal {
  qty: number;
  total: number;
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

/** Sorted `[name, group]` pairs, descending by revenue. */
export function sortedByRevenue(groups: Record<string, GroupTotal>): [string, GroupTotal][] {
  return Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
}
