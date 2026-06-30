/** Live notification feed: expiring memberships + low-stock products. */
import { useQuery } from '../../store/useQuery';
import { membershipStatus } from '../memberships/membershipUtils';
import { formatDate } from '../../utils/dates';
import type { Membership, Product } from '../../types';

export interface AppNotification {
  color: string;
  title: string;
  sub: string;
}

export function useNotifications(): AppNotification[] {
  const memberships = useQuery<Membership>(`SELECT * FROM memberships`);
  const lowStock = useQuery<Product>(
    `SELECT * FROM products WHERE track_stock=1 AND active=1 AND stock<=min_stock`,
  );

  const out: AppNotification[] = [];
  for (const m of memberships) {
    if (membershipStatus(m) === 'expiring') {
      out.push({
        color: 'var(--amber)',
        title: `${m.client_name} — expiring`,
        sub: `${m.plan_name} · expires ${formatDate(m.end_date)}`,
      });
    }
  }
  for (const p of lowStock) {
    out.push({
      color: 'var(--amber)',
      title: `Low stock: ${p.name}`,
      sub: `${p.stock} left (min ${p.min_stock})`,
    });
  }
  return out;
}
