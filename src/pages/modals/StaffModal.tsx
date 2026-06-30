import { useEffect, useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { mutate, query } from '../../data/db';
import { toast } from '../../store/toastStore';
import { nowISO } from '../../utils/dates';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Field, FormRow } from '../../components/common/Field';
import type { StaffMember, StaffRole } from '../../types';

interface FormState {
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
}

const BLANK: FormState = { name: '', role: 'reception', phone: '', email: '' };

const ROLES: StaffRole[] = ['owner', 'manager', 'reception', 'trainer'];

export function StaffModal() {
  const { open, editId } = useModalStore((s) => s.staff);
  const close = useModalStore((s) => s.closeStaff);
  const [form, setForm] = useState<FormState>(BLANK);

  useEffect(() => {
    if (!open) return;
    if (editId) {
      const s = query<StaffMember>('SELECT * FROM staff WHERE id=?', [editId])[0];
      if (s) setForm({ name: s.name, role: s.role, phone: s.phone || '', email: s.email || '' });
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
    if (editId) {
      mutate(`UPDATE staff SET name=?,role=?,phone=?,email=? WHERE id=?`, [name, form.role, form.phone, form.email, editId]);
    } else {
      mutate(`INSERT INTO staff(name,role,phone,email,active,created_at) VALUES(?,?,?,?,1,?)`, [
        name, form.role, form.phone, form.email, nowISO(),
      ]);
    }
    toast(editId ? 'Updated ✓' : 'Staff added ✓');
    close();
  }

  return (
    <Modal
      open={open}
      title={editId ? 'Edit Staff' : 'Add Staff'}
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save Staff
          </Button>
        </>
      }
    >
      <FormRow>
        <Field label="Full Name *">
          <input value={form.name} placeholder="Full name" onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Role *">
          <select value={form.role} onChange={(e) => set('role', e.target.value as StaffRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Phone">
          <input value={form.phone} placeholder="Phone" onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Email">
          <input value={form.email} placeholder="Email" onChange={(e) => set('email', e.target.value)} />
        </Field>
      </FormRow>
    </Modal>
  );
}
