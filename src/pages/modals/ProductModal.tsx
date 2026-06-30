import { useEffect, useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { mutate, query } from '../../data/db';
import { toast } from '../../store/toastStore';
import { nowISO } from '../../utils/dates';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Field, FormRow } from '../../components/common/Field';
import type { Product } from '../../types';

interface FormState {
  name: string;
  category: string;
  price: string;
  cost: string;
  stock: string;
  minStock: string;
  description: string;
  active: boolean;
  showPos: boolean;
  trackStock: boolean;
}

const BLANK: FormState = {
  name: '',
  category: 'supplement',
  price: '',
  cost: '',
  stock: '',
  minStock: '',
  description: '',
  active: true,
  showPos: true,
  trackStock: false,
};

export function ProductModal() {
  const { open, editId } = useModalStore((s) => s.product);
  const close = useModalStore((s) => s.closeProduct);
  const [form, setForm] = useState<FormState>(BLANK);

  useEffect(() => {
    if (!open) return;
    if (editId) {
      const p = query<Product>('SELECT * FROM products WHERE id=?', [editId])[0];
      if (p) {
        setForm({
          name: p.name,
          category: p.category,
          price: String(p.sale_price),
          cost: p.cost_price ? String(p.cost_price) : '',
          stock: p.stock ? String(p.stock) : '',
          minStock: p.min_stock ? String(p.min_stock) : '',
          description: p.description || '',
          active: !!p.active,
          showPos: !!p.show_pos,
          trackStock: !!p.track_stock,
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
      form.category,
      parseFloat(form.price) || 0,
      parseFloat(form.cost) || 0,
      parseInt(form.stock, 10) || 0,
      parseInt(form.minStock, 10) || 5,
      form.description.trim(),
      form.active ? 1 : 0,
      form.showPos ? 1 : 0,
      form.trackStock ? 1 : 0,
    ];
    if (editId) {
      mutate(
        `UPDATE products SET name=?,category=?,sale_price=?,cost_price=?,stock=?,min_stock=?,description=?,active=?,show_pos=?,track_stock=? WHERE id=?`,
        [...data, editId],
      );
    } else {
      mutate(
        `INSERT INTO products(name,category,sale_price,cost_price,stock,min_stock,description,active,show_pos,track_stock,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        [...data, nowISO()],
      );
    }
    toast(editId ? 'Product updated ✓' : 'Product added ✓');
    close();
  }

  return (
    <Modal
      open={open}
      title={editId ? 'Edit Product' : 'Add Product'}
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save Product
          </Button>
        </>
      }
    >
      <FormRow>
        <Field label="Product Name *">
          <input value={form.name} placeholder="e.g. Protein Bar" onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Category *">
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option value="supplement">Supplement</option>
            <option value="other">Other</option>
            <option value="service">Service</option>
          </select>
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Sale Price *">
          <input type="number" min={0} step={0.01} value={form.price} placeholder="0.00" onChange={(e) => set('price', e.target.value)} />
        </Field>
        <Field label="Cost Price">
          <input type="number" min={0} step={0.01} value={form.cost} placeholder="0.00" onChange={(e) => set('cost', e.target.value)} />
        </Field>
      </FormRow>
      <FormRow>
        <Field label="Stock Qty">
          <input type="number" min={0} value={form.stock} placeholder="0" onChange={(e) => set('stock', e.target.value)} />
        </Field>
        <Field label="Min Stock Level">
          <input type="number" min={0} value={form.minStock} placeholder="5" onChange={(e) => set('minStock', e.target.value)} />
        </Field>
      </FormRow>
      <Field label="Description">
        <textarea value={form.description} style={{ minHeight: 50 }} placeholder="Optional description" onChange={(e) => set('description', e.target.value)} />
      </Field>
      <div className="checkbox-row">
        <label>
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Active
        </label>
        <label>
          <input type="checkbox" checked={form.showPos} onChange={(e) => set('showPos', e.target.checked)} /> Show on POS
        </label>
        <label>
          <input type="checkbox" checked={form.trackStock} onChange={(e) => set('trackStock', e.target.checked)} /> Track Stock
        </label>
      </div>
    </Modal>
  );
}
