import { useEffect, useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { mutate, query } from '../../data/db';
import { toast } from '../../store/toastStore';
import { nowISO } from '../../utils/dates';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Field, FormRow } from '../../components/common/Field';
import type { Client } from '../../types';

const BLANK = { fname: '', lname: '', phone: '', email: '', dob: '', notes: '' };

export function ClientModal() {
  const { open, editId } = useModalStore((s) => s.client);
  const close = useModalStore((s) => s.closeClient);
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (!open) return;
    if (editId) {
      const c = query<Client>('SELECT * FROM clients WHERE id=?', [editId])[0];
      if (c) {
        setForm({
          fname: c.fname || '',
          lname: c.lname || '',
          phone: c.phone || '',
          email: c.email || '',
          dob: c.dob || '',
          notes: c.notes || '',
        });
      }
    } else {
      setForm(BLANK);
    }
  }, [open, editId]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    const fname = form.fname.trim();
    if (!fname) return toast('First name required', 'var(--red)');
    const now = nowISO();
    const lname = form.lname.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const notes = form.notes.trim();
    if (editId) {
      mutate(`UPDATE clients SET fname=?,lname=?,phone=?,email=?,dob=?,notes=?,updated_at=? WHERE id=?`, [
        fname, lname, phone, email, form.dob, notes, now, editId,
      ]);
    } else {
      mutate(
        `INSERT INTO clients(fname,lname,phone,email,dob,notes,status,created_at,updated_at) VALUES(?,?,?,?,?,?,'active',?,?)`,
        [fname, lname, phone, email, form.dob, notes, now, now],
      );
    }
    toast(editId ? 'Client updated ✓' : 'Client added ✓');
    close();
  }

  return (
    <Modal
      open={open}
      title={editId ? 'Edit Client' : 'New Client'}
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save Client
          </Button>
        </>
      }
    >
      <FormRow>
        <Field label="First Name *">
          <input value={form.fname} placeholder="First name" onChange={(e) => set('fname', e.target.value)} />
        </Field>
        <Field label="Last Name *">
          <input value={form.lname} placeholder="Last name" onChange={(e) => set('lname', e.target.value)} />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Phone">
          <input value={form.phone} placeholder="Phone number" onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Email">
          <input value={form.email} placeholder="Email address" onChange={(e) => set('email', e.target.value)} />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Date of Birth">
          <input type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
        </Field>
        <Field label="Notes">
          <input value={form.notes} placeholder="Optional notes" onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </FormRow>
    </Modal>
  );
}
