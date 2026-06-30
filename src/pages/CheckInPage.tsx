import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useQuery } from '../store/useQuery';
import { batch, mutate, query } from '../data/db';
import { getActiveMembership, membershipStatus, visitsRemaining } from '../features/memberships/membershipUtils';
import { toast } from '../store/toastStore';
import { nowISO, nowTime, todayISO, formatDate } from '../utils/dates';
import { initials } from '../utils/validation';
import { StatusBadge, Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import type { Client, Membership, Visit } from '../types';

export function CheckInPage() {
  const setRoute = useAppStore((s) => s.setRoute);
  const today = todayISO();
  const todayVisits = useQuery<Visit>(`SELECT * FROM visits WHERE visit_date=? ORDER BY created_at DESC`, [today]);

  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [picked, setPicked] = useState<Client | null>(null);
  const [registered, setRegistered] = useState<{ name: string; remaining: number | null } | null>(null);

  function onSearch(value: string) {
    setTerm(value);
    setPicked(null);
    setRegistered(null);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setResults(
      query<Client>(`SELECT * FROM clients WHERE lower(fname||' '||lname) LIKE ? OR phone LIKE ? LIMIT 6`, [
        '%' + value.toLowerCase() + '%',
        '%' + value + '%',
      ]),
    );
  }

  function pick(c: Client) {
    setPicked(c);
    setResults([]);
    setRegistered(null);
    setTerm(`${c.fname} ${c.lname}`);
  }

  function register(client: Client, membership: Membership) {
    batch(() => {
      mutate(
        `INSERT INTO visits(client_id,client_name,membership_id,visit_type,visit_date,visit_time,created_at) VALUES(?,?,?,?,?,?,?)`,
        [client.id, `${client.fname} ${client.lname}`, membership.id, 'membership', today, nowTime(), nowISO()],
      );
      mutate(`UPDATE memberships SET visits_used=visits_used+1,updated_at=? WHERE id=?`, [nowISO(), membership.id]);
    });
    const updated = query<Membership>(`SELECT * FROM memberships WHERE id=?`, [membership.id])[0];
    setRegistered({ name: `${client.fname} ${client.lname}`, remaining: visitsRemaining(updated) });
    setPicked(null);
    setTerm('');
    setResults([]);
    toast('Check-in registered ✓');
  }

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Check-In</div>
          <div className="ps">Verify membership and register entry</div>
        </div>
      </div>

      <div className="checkin-box">
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title">Find Client</div>
          <div className="fg">
            <label>Name or Phone Number</label>
            <input
              value={term}
              placeholder="Start typing name or phone…"
              style={{ fontSize: 16, padding: 12 }}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          {results.length > 0 && (
            <div>
              {results.map((c) => {
                const am = getActiveMembership(c.id);
                const st = am ? membershipStatus(am) : 'inactive';
                return (
                  <div className="member-pick" key={c.id} onClick={() => pick(c)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>
                        {c.fname} {c.lname}
                      </span>
                      <StatusBadge status={st} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                      {c.phone || 'No phone'} · {am ? `${am.plan_name} · ${formatDate(am.end_date)}` : 'No membership'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {picked && <ValidityCard client={picked} onRegister={register} onSell={() => setRoute('pos')} />}

          {registered && (
            <div className="checkin-result ci-ok">
              ✅ Entry registered for <strong>{registered.name}</strong>
              {registered.remaining !== null ? ` · ${registered.remaining} visits remaining` : ''}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            Today's Check-Ins <Badge className="bb">{todayVisits.length}</Badge>
          </div>
          {todayVisits.length ? (
            todayVisits.slice(0, 20).map((v) => (
              <div className="vis-row" key={v.id}>
                <div className="avatar">{initials(v.client_name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{v.client_name}</div>
                  <div className="ts">{v.visit_time}</div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon="👣">No check-ins yet</EmptyState>
          )}
        </div>
      </div>
    </>
  );
}

function ValidityCard({
  client,
  onRegister,
  onSell,
}: {
  client: Client;
  onRegister: (c: Client, m: Membership) => void;
  onSell: () => void;
}) {
  const am = getActiveMembership(client.id);
  const status = am ? membershipStatus(am) : 'inactive';

  if (am && (status === 'active' || status === 'expiring')) {
    const remaining = visitsRemaining(am);
    return (
      <>
        <div className="checkin-result ci-ok">
          ✅ <strong>{client.fname} {client.lname}</strong> — {am.plan_name}
          {remaining !== null ? ` · ${remaining} visits left` : ' · Unlimited'}
        </div>
        <Button variant="primary" style={{ width: '100%', marginTop: 10, fontSize: 15, padding: 12 }} onClick={() => onRegister(client, am)}>
          ✅ Register Entry
        </Button>
      </>
    );
  }

  if (status === 'expired') {
    return (
      <>
        <div className="checkin-result ci-fail">
          ❌ Membership expired — {am ? formatDate(am.end_date) : 'no membership'}
        </div>
        <Button variant="amber" style={{ width: '100%', marginTop: 10 }} onClick={onSell}>
          Sell New Membership
        </Button>
      </>
    );
  }

  if (status === 'frozen') {
    return <div className="checkin-result ci-warn">🔒 Membership is frozen</div>;
  }

  return (
    <>
      <div className="checkin-result ci-fail">❌ No active membership</div>
      <Button variant="amber" style={{ width: '100%', marginTop: 10 }} onClick={onSell}>
        Sell Membership
      </Button>
    </>
  );
}
