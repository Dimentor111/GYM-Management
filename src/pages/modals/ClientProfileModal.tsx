import { useModalStore } from '../../store/modalStore';
import { useAppStore } from '../../store/appStore';
import { query } from '../../data/db';
import { useFormatMoney } from '../../store/useQuery';
import { getActiveMembership, membershipStatus, visitsRemaining } from '../../features/memberships/membershipUtils';
import { formatDate } from '../../utils/dates';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import type { Client, Membership, Visit } from '../../types';

export function ClientProfileModal() {
  const { open, clientId } = useModalStore((s) => s.clientProfile);
  const close = useModalStore((s) => s.closeClientProfile);
  // Subscribe to revision so a check-in elsewhere refreshes the open profile.
  useAppStore((s) => s.revision);
  const fc = useFormatMoney();

  const client = open && clientId ? query<Client>('SELECT * FROM clients WHERE id=?', [clientId])[0] : undefined;

  if (!client) {
    return <Modal open={open} title="Client Profile" onClose={close} footer={<Button variant="ghost" onClick={close}>Close</Button>} wide><div /></Modal>;
  }

  const memberships = query<Membership>('SELECT * FROM memberships WHERE client_id=? ORDER BY created_at DESC', [client.id]);
  const visits = query<Visit>('SELECT * FROM visits WHERE client_id=? ORDER BY created_at DESC LIMIT 20', [client.id]);
  const am = getActiveMembership(client.id);
  const amStatus = am ? membershipStatus(am) : 'inactive';

  return (
    <Modal
      open={open}
      title={`${client.fname} ${client.lname}`}
      onClose={close}
      wide
      footer={
        <Button variant="ghost" onClick={close}>
          Close
        </Button>
      }
    >
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <Detail label="Phone" value={client.phone || '—'} />
        <Detail label="Email" value={client.email || '—'} />
        <Detail label="Date of Birth" value={formatDate(client.dob)} />
        <Detail label="Registered" value={formatDate(client.created_at?.slice(0, 10))} />
      </div>

      {client.notes && (
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 12, fontSize: 13, color: 'var(--text2)' }}>
          {client.notes}
        </div>
      )}

      <div className="divider" />
      <div className="sec-title">Current Membership</div>
      {am ? (
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{am.plan_name}</span>
            <StatusBadge status={amStatus} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
            {formatDate(am.start_date)} – {formatDate(am.end_date)} ·{' '}
            {visitsRemaining(am) !== null ? `${visitsRemaining(am)} visits left` : 'Unlimited'} · {fc(am.price)}
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 14 }}>No active membership</div>
      )}

      <div className="sec-title">Membership History ({memberships.length})</div>
      {memberships.length ? (
        <div className="tbl-wrap" style={{ marginBottom: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Start</th>
                <th>End</th>
                <th>Price</th>
                <th>Visits</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map((m) => (
                <tr key={m.id}>
                  <td className="td-name">{m.plan_name}</td>
                  <td>{formatDate(m.start_date)}</td>
                  <td>{formatDate(m.end_date)}</td>
                  <td style={{ color: 'var(--green)' }}>{fc(m.price)}</td>
                  <td>
                    {m.visits_used || 0}/{m.total_visits || '∞'}
                  </td>
                  <td>
                    <StatusBadge status={membershipStatus(m)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 14 }}>No memberships</div>
      )}

      <div className="sec-title">Recent Visits ({visits.length})</div>
      {visits.length ? (
        <div style={{ maxHeight: 120, overflowY: 'auto' }}>
          {visits.map((v) => (
            <div className="vis-row" key={v.id}>
              <span style={{ color: 'var(--text2)', fontSize: 12 }}>{formatDate(v.visit_date)}</span>
              <span className="ts" style={{ marginLeft: 8 }}>
                {v.visit_time}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>No visits recorded</div>
      )}
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div style={{ fontWeight: 600, marginTop: 3 }}>{value}</div>
    </div>
  );
}
