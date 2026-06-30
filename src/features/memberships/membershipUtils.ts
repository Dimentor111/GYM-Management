/**
 * Membership & client status logic.
 *
 * The status ordering here is significant and preserved exactly from the
 * original: frozen/canceled win first; then date-expiry; then the 7-day
 * "expiring" window; and only then visit-limit exhaustion. (So a visit-exhausted
 * card within 7 days of its end date still reads as "expiring".)
 */
import { query } from '../../data/db';
import { todayISO } from '../../utils/dates';
import type { ClientStatus, Membership, MembershipStatus } from '../../types';

type StatusInput = Pick<Membership, 'status' | 'end_date' | 'total_visits' | 'visits_used'>;

export function membershipStatus(m: StatusInput): MembershipStatus {
  if (m.status === 'frozen') return 'frozen';
  if (m.status === 'canceled') return 'canceled';
  const today = todayISO();
  const end = m.end_date;
  if (!end || today > end) return 'expired';
  const days = (new Date(end).getTime() - new Date(today).getTime()) / 86_400_000;
  if (days <= 7) return 'expiring';
  if (m.total_visits > 0 && (m.visits_used || 0) >= m.total_visits) return 'expired';
  return 'active';
}

/** The client's currently-valid membership (active or expiring), most recent first. */
export function getActiveMembership(clientId: number): Membership | null {
  const memberships = query<Membership>(
    `SELECT * FROM memberships WHERE client_id=? ORDER BY created_at DESC`,
    [clientId],
  );
  for (const m of memberships) {
    const s = membershipStatus(m);
    if (s === 'active' || s === 'expiring') return m;
  }
  return null;
}

/** Overall client status: inactive when there's no valid membership. */
export function clientStatus(clientId: number): ClientStatus {
  const active = getActiveMembership(clientId);
  if (!active) return 'inactive';
  return membershipStatus(active) as ClientStatus;
}

/** Remaining visits for a membership, or null when unlimited. */
export function visitsRemaining(m: Pick<Membership, 'total_visits' | 'visits_used'>): number | null {
  return m.total_visits > 0 ? m.total_visits - (m.visits_used || 0) : null;
}
