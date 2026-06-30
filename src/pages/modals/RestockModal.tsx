import { useEffect, useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { batch, mutate, query } from '../../data/db';
import { toast } from '../../store/toastStore';
import { nowISO } from '../../utils/dates';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Field } from '../../components/common/Field';
import type { Product } from '../../types';

export function RestockModal() {
  const { open, productId } = useModalStore((s) => s.restock);
  const close = useModalStore((s) => s.closeRestock);

  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    const list = query<Product>('SELECT * FROM products WHERE track_stock=1 AND active=1 ORDER BY name');
    setProducts(list);
    setSelected(productId ?? list[0]?.id ?? null);
    setQty('');
    setNote('');
  }, [open, productId]);

  function save() {
    const amount = parseInt(qty, 10) || 0;
    if (!selected) return toast('No product selected', 'var(--red)');
    if (amount < 1) return toast('Enter quantity', 'var(--red)');
    const product = products.find((p) => p.id === selected);
    batch(() => {
      mutate('UPDATE products SET stock=stock+? WHERE id=?', [amount, selected]);
      mutate('INSERT INTO stock_movements(product_id,product_name,type,qty,notes,created_at) VALUES(?,?,?,?,?,?)', [
        selected,
        product?.name ?? '',
        'restock',
        amount,
        note,
        nowISO(),
      ]);
    });
    toast(`Restocked +${amount} ✓`);
    close();
  }

  return (
    <Modal
      open={open}
      title="Restock Product"
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} disabled={!products.length}>
            Add Stock
          </Button>
        </>
      }
    >
      {products.length ? (
        <>
          <Field label="Product *">
            <select value={selected ?? ''} onChange={(e) => setSelected(Number(e.target.value))}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.stock})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Add Quantity *">
            <input type="number" min={1} value={qty} placeholder="0" onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Field label="Note">
            <input value={note} placeholder="Optional note" onChange={(e) => setNote(e.target.value)} />
          </Field>
        </>
      ) : (
        <div className="empty">
          <div className="empty-icon">📦</div>
          No stock-tracked products. Add a product with “Track Stock” enabled first.
        </div>
      )}
    </Modal>
  );
}
