import { useEffect, useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { mutate, query } from '../../data/db';
import { toast } from '../../store/toastStore';
import { nowISO } from '../../utils/dates';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Field, FormRow } from '../../components/common/Field';
import type { MembershipPlan, PlanColor } from '../../types';

interface FormState {
  name: string;
  price: string;
  days: string;
  visits: string;
  maxPerDay: string;
  color: PlanColor;
  description: string;
  active: boolean;
  showPos: boolean;
  canFreeze: boolean;
  canRenew: boolean;
}

const BLANK: FormState = {
  name: '',
  price: '',
  days: '',
  visits: '',
  maxPerDay: '1',
  color: 'purple',
  description: '',
  active: true,
  showPos: true,
  canFreeze: false,
  canRenew: true,
};

const COLORS: PlanColor[] = ['purple', 'green', 'blue', 'amber', 'red', 'cyan'];

export function PlanModal() {
  const { open, editId } = useModalStore((s) => s.plan);
  const close = useModalStore((s) => s.closePlan);
  const [form, setForm] = useState<FormState>(BLANK);

  useEffect(() => {
    if (!open) return;
    if (editId) {
      const p = query<MembershipPlan>('SELECT * FROM membership_plans WHERE id=?', [editId])[0];
      if (p) {
        setForm({
          name: p.name,
          price: String(p.price),
          days: String(p.duration_days),
          visits: p.total_visits ? String(p.total_visits) : '',
          maxPerDay: String(p.max_visits_day || 1),
          color: p.color || 'purple',
          description: p.description || '',
          active: !!p.active,
          showPos: !!p.show_pos,
          canFreeze: !!p.can_freeze,
          canRenew: !!p.can_renew,
        });
      }
    } else {
      setForm(BLANK);
    }
  }, [open, editId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    const name = form.name.trim();
    if (!name) return toast('Name required', 'var(--red)');
    const data = [
      name,
      parseFloat(form.price) || 0,
      parseInt(form.days, 10) || 30,
      parseInt(form.visits, 10) || 0,
      parseInt(form.maxPerDay, 10) || 1,
      form.description.trim(),
      form.color,
      form.canFreeze ? 1 : 0,
      form.canRenew ? 1 : 0,
      form.active ? 1 : 0,
      form.showPos ? 1 : 0,
    ];
    if (editId) {
      mutate(
        `UPDATE membership_plans SET name=?,price=?,duration_days=?,total_visits=?,max_visits_day=?,description=?,color=?,can_freeze=?,can_renew=?,active=?,show_pos=? WHERE id=?`,
        [...data, editId],
      );
    } else {
      mutate(
        `INSERT INTO membership_plans(name,price,duration_days,total_visits,max_visits_day,description,color,can_freeze,can_renew,active,show_pos,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
        [...data, nowISO()],
      );
    }
    toast(editId ? 'Plan updated ✓' : 'Plan created ✓');
    close();
  }

  return (
    <Modal
      open={open}
      title={editId ? 'Edit Plan' : 'New Membership Plan'}
      onClose={close}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save Plan
          </Button>
        </>
      }
    >
      <FormRow>
        <Field label="Plan Name *">
          <input value={form.name} placeholder="e.g. Monthly Unlimited" onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Price *">
          <input type="number" min={0} step={0.01} value={form.price} placeholder="0.00" onChange={(e) => set('price', e.target.value)} />
        </Field>
      </FormRow>
      <FormRow cols={3}>
        <Field label="Duration (days) *">
          <input type="number" min={1} value={form.days} placeholder="30" onChange={(e) => set('days', e.target.value)} />
        </Field>
        <Field label="Total Visits (0=unlimited)">
          <input type="number" min={0} value={form.visits} placeholder="0" onChange={(e) => set('visits', e.target.value)} />
        </Field>
        <Field label="Max Visits/Day">
          <input type="number" min={1} value={form.maxPerDay} onChange={(e) => set('maxPerDay', e.target.value)} />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Color Tag">
          <select value={form.color} onChange={(e) => set('color', e.target.value as PlanColor)}>
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <input value={form.description} placeholder="Short description…" onChange={(e) => set('description', e.target.value)} />
        </Field>
      </FormRow>
      <div className="checkbox-row" style={{ marginBottom: 4 }}>
        <label>
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Active
        </label>
        <label>
          <input type="checkbox" checked={form.showPos} onChange={(e) => set('showPos', e.target.checked)} /> Show on POS
        </label>
        <label>
          <input type="checkbox" checked={form.canFreeze} onChange={(e) => set('canFreeze', e.target.checked)} /> Can Freeze
        </label>
        <label>
          <input type="checkbox" checked={form.canRenew} onChange={(e) => set('canRenew', e.target.checked)} /> Can Renew
        </label>
      </div>
    </Modal>
  );
}
