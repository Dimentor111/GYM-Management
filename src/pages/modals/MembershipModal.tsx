import { useModalStore } from '../../store/modalStore';
import { mutate, query } from '../../data/db';
import { useFormatMoney } from '../../store/useQuery';
import { confirmDialog } from '../../store/confirmStore';
import { toast } from '../../store/toastStore';
import { membershipStatus } from '../../features/memberships/membershipUtils';
import { nowISO, formatDate } from '../../utils/dates';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/Badge';
import type { Membership } from '../../types';

export function MembershipModal() {
  const { open, membershipId } = useModalStore((s) => s.membership);
  const close = useModalStore((s) => s.closeMembership);
  const fc = useFormatMoney();

  const m = open && membershipId ? query<Membership>('SELECT * FROM memberships WHERE id=?', [membershipId])[0] : undefined;
  const status = m ? membershipStatus(m) : 'expired';

  function freeze() {
    if (!m) return;
    mutate(`UPDATE memberships SET status='frozen',updated_at=? WHERE id=?`, [nowISO(), m.id]);
    toast('Membership frozen');
    close();
  }

  async function cancel() {
    if (!m) return;
    if (await confirmDialog('Cancel this membership?')) {
      mutate(`UPDATE memberships SET status='canceled',updated_at=? WHERE id=?`, [nowISO(), m.id]);
      toast('Canceled', 'var(--red)');
      close();
    }
  }

  function unfreeze() {
    if (!m) return;
    mutate(`UPDATE memberships SET status='active',updated_at=? WHERE id=?`, [nowISO(), m.id]);
    toast('Unfrozen ✓');
    close();
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={close}>
        Close
      </Button>
      {(status === 'active' || status === 'expiring') && (
        <>
          <Button variant="amber" onClick={freeze}>
            Freeze
          </Button>
          <Button variant="danger" onClick={cancel}>
            Cancel
          </Button>
        </>
      )}
      {status === 'frozen' && (
        <Button variant="success" onClick={unfreeze}>
          Unfreeze
        </Button>
      )}
    </>
  );

  return (
    <Modal open={open} title="Membership Details" onClose={close} footer={footer}>
      {m && (
        <>
          <div className="grid g2" style={{ marginBottom: 14 }}>
            <Detail label="Client" value={m.client_name} big />
            <Detail label="Plan" value={m.plan_name} big />
            <Detail label="Period" value={`${formatDate(m.start_date)} – ${formatDate(m.end_date)}`} />
            <Detail label="Visits Used" value={`${m.visits_used || 0} / ${m.total_visits || '∞'}`} />
            <Detail label="Price Paid" value={fc(m.price)} green />
            <div>
              <div className="stat-label">Status</div>
              <div style={{ marginTop: 3 }}>
                <StatusBadge status={status} />
              </div>
            </div>
            <Detail label="Payment" value={m.payment_method || '—'} />
            <Detail label="Sold By" value={m.staff_name || '—'} />
          </div>
          {m.notes && (
            <div style={{ background: 'var(--bg3)', padding: '8px 12px', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--text2)' }}>
              {m.notes}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

function Detail({ label, value, big, green }: { label: string; value: string; big?: boolean; green?: boolean }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div
        style={{
          fontWeight: big ? 700 : 600,
          fontSize: big ? 15 : undefined,
          color: green ? 'var(--green)' : undefined,
          marginTop: 3,
        }}
      >
        {value}
      </div>
    </div>
  );
}
