import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useModalStore } from '../store/modalStore';
import { useQuery } from '../store/useQuery';
import { scalar } from '../data/db';
import { clientStatus, getActiveMembership } from '../features/memberships/membershipUtils';
import { formatDate } from '../utils/dates';
import { StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { FilterChips, type ChipOption } from '../components/common/FilterChips';
import type { Client, ClientStatus } from '../types';

type Filter = 'all' | ClientStatus;

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'expiring', label: 'Expiring' },
  { value: 'expired', label: 'Expired' },
  { value: 'inactive', label: 'Inactive' },
];

export function ClientsPage() {
  const openClient = useModalStore((s) => s.openClient);
  const openClientProfile = useModalStore((s) => s.openClientProfile);
  const seed = useAppStore((s) => s.clientSearchSeed);
  const setSeed = useAppStore((s) => s.setClientSearchSeed);

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  // Pick up a search term handed over from the global header search.
  useEffect(() => {
    if (seed) {
      setSearch(seed);
      setSeed('');
    }
  }, [seed, setSeed]);

  const all = useQuery<Client>(`SELECT * FROM clients ORDER BY created_at DESC`);

  const filtered = all.filter((c) => {
    if (search) {
      const hay = `${c.fname} ${c.lname} ${c.phone || ''} ${c.email || ''}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    if (filter !== 'all' && clientStatus(c.id) !== filter) return false;
    return true;
  });

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Clients</div>
          <div className="ps">{filtered.length} client(s)</div>
        </div>
        <div className="ph-right">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            style={{ width: 220 }}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="primary" onClick={() => openClient()}>
            + New Client
          </Button>
        </div>
      </div>

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      <div className="card-flush">
        {filtered.length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Membership</th>
                  <th>Expires</th>
                  <th>Visits</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const am = getActiveMembership(c.id);
                  const status = clientStatus(c.id);
                  const visits = scalar<number>(`SELECT COUNT(*) FROM visits WHERE client_id=?`, [c.id]) ?? 0;
                  return (
                    <tr key={c.id}>
                      <td className="td-name">
                        {c.fname} {c.lname}
                      </td>
                      <td>{c.phone || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td>{am ? am.plan_name : <span style={{ color: 'var(--text3)' }}>None</span>}</td>
                      <td>{am ? formatDate(am.end_date) : '—'}</td>
                      <td>{visits}</td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      <td className="ts">{formatDate(c.created_at?.slice(0, 10))}</td>
                      <td>
                        <div className="td-actions">
                          <Button variant="ghost" size="xs" onClick={() => openClientProfile(c.id)}>
                            View
                          </Button>
                          <Button variant="ghost" size="xs" onClick={() => openClient(c.id)}>
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">👥</div>
            No clients found
          </div>
        )}
      </div>
    </>
  );
}
