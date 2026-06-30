import { useState } from 'react';
import { useModalStore } from '../store/modalStore';
import { useQuery, useFormatMoney } from '../store/useQuery';
import { mutate } from '../data/db';
import { membershipStatus } from '../features/memberships/membershipUtils';
import { toast } from '../store/toastStore';
import { nowISO, formatDate } from '../utils/dates';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { FilterChips, type ChipOption } from '../components/common/FilterChips';
import type { Membership, MembershipStatus } from '../types';

type Filter = 'all' | MembershipStatus;

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'canceled', label: 'Canceled' },
];

export function MembershipsPage() {
  const openMembership = useModalStore((s) => s.openMembership);
  const fc = useFormatMoney();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const rows = useQuery<Membership>(`SELECT * FROM memberships ORDER BY created_at DESC`).map((m) => ({
    ...m,
    _status: membershipStatus(m),
  }));

  const filtered = rows.filter((m) => {
    if (filter !== 'all' && m._status !== filter) return false;
    if (search) {
      const term = search.toLowerCase();
      if (!(m.client_name || '').toLowerCase().includes(term) && !(m.plan_name || '').toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  function freeze(id: number) {
    mutate(`UPDATE memberships SET status='frozen',updated_at=? WHERE id=?`, [nowISO(), id]);
    toast('Membership frozen');
  }

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Memberships</div>
          <div className="ps">All sold membership cards</div>
        </div>
        <div className="ph-right">
          <input type="text" placeholder="Search…" value={search} style={{ width: 200 }} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      <div className="card-flush">
        {filtered.length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Plan</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Visits</th>
                  <th>Price</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Sold By</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td className="td-name">{m.client_name}</td>
                    <td>{m.plan_name}</td>
                    <td>{formatDate(m.start_date)}</td>
                    <td>{formatDate(m.end_date)}</td>
                    <td>{m.total_visits > 0 ? `${m.visits_used || 0}/${m.total_visits}` : '∞'}</td>
                    <td style={{ color: 'var(--green)' }}>{fc(m.price)}</td>
                    <td>{m.payment_method || '—'}</td>
                    <td>
                      <StatusBadge status={m._status} />
                    </td>
                    <td className="ts">{m.staff_name || '—'}</td>
                    <td>
                      <div className="td-actions">
                        <Button variant="ghost" size="xs" onClick={() => openMembership(m.id)}>
                          View
                        </Button>
                        {(m._status === 'active' || m._status === 'expiring') && (
                          <Button variant="amber" size="xs" onClick={() => freeze(m.id)}>
                            Freeze
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">🎫</div>
            No memberships found
          </div>
        )}
      </div>
    </>
  );
}
