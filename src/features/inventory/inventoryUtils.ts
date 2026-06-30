/** Inventory display helpers: stock health and progress-bar styling. */
import type { Product } from '../../types';

export interface StockStatus {
  /** Progress-bar fill percentage (0-100). */
  pct: number;
  /** CSS color var for the bar fill. */
  color: string;
  /** Badge label + class. */
  label: string;
  badgeClass: 'br' | 'ba' | 'bg';
}

export function stockStatus(p: Pick<Product, 'stock' | 'min_stock'>): StockStatus {
  const pct = p.min_stock > 0 ? Math.min(100, Math.round((p.stock / p.min_stock) * 100)) : 100;
  if (p.stock <= p.min_stock) {
    return { pct, color: 'var(--red)', label: 'Low', badgeClass: 'br' };
  }
  if (p.stock <= p.min_stock * 1.5) {
    return { pct, color: 'var(--amber)', label: 'Watch', badgeClass: 'ba' };
  }
  return { pct, color: 'var(--green)', label: 'OK', badgeClass: 'bg' };
}
