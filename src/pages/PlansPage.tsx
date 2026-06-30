import { useModalStore } from '../store/modalStore';
import { useQuery, useFormatMoney } from '../store/useQuery';
import { mutate } from '../data/db';
import { confirmDialog } from '../store/confirmStore';
import { toast } from '../store/toastStore';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import type { MembershipPlan, PlanColor } from '../types';

const COLOR_VARS: Record<PlanColor, string> = {
  purple: 'var(--purple)',
  green: 'var(--green)',
  blue: 'var(--blue)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  cyan: 'var(--cyan)',
};

export function PlansPage() {
  const openPlan = useModalStore((s) => s.openPlan);
  const fc = useFormatMoney();
  const plans = useQuery<MembershipPlan>(`SELECT * FROM membership_plans ORDER BY price`);

  async function remove(id: number) {
    if (await confirmDialog('Delete plan?')) {
      mutate('DELETE FROM membership_plans WHERE id=?', [id]);
      toast('Deleted', 'var(--red)');
    }
  }

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Membership Plans</div>
          <div className="ps">Configure your membership types and prices</div>
        </div>
        <div className="ph-right">
          <Button variant="primary" onClick={() => openPlan()}>
            + New Plan
          </Button>
        </div>
      </div>

      {plans.length ? (
        <div className="grid g3">
          {plans.map((p) => {
            const col = COLOR_VARS[p.color] || 'var(--purple)';
            return (
              <div className="plan-card" key={p.id} style={{ borderColor: `${col}33` }}>
                <div className="plan-card-stripe" style={{ background: col }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: col }}>{p.name}</div>
                  <Badge className={p.active ? 'bg' : 'br'}>{p.active ? 'Active' : 'Off'}</Badge>
                </div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{fc(p.price)}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>⏱ {p.duration_days} days</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>
                  🎯 {p.total_visits || 'Unlimited'} visits · max {p.max_visits_day}/day
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{p.can_freeze ? '🔒 Freezable · ' : ''}</div>
                {p.description && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>{p.description}</div>}
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <Button variant="ghost" size="sm" onClick={() => openPlan(p.id)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove(p.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-icon">📋</div>
          No plans yet. Create your first membership plan!
        </div>
      )}
    </>
  );
}
