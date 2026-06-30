import { useState } from 'react';
import { useModalStore } from '../store/modalStore';
import { useQuery, useFormatMoney } from '../store/useQuery';
import { mutate } from '../data/db';
import { confirmDialog } from '../store/confirmStore';
import { toast } from '../store/toastStore';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { FilterChips, type ChipOption } from '../components/common/FilterChips';
import type { Product } from '../types';

type Filter = 'all' | 'supplement' | 'other' | 'service' | 'inactive';

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'All' },
  { value: 'supplement', label: 'Supplements' },
  { value: 'other', label: 'Other' },
  { value: 'service', label: 'Services' },
  { value: 'inactive', label: 'Inactive' },
];

export function ProductsPage() {
  const openProduct = useModalStore((s) => s.openProduct);
  const fc = useFormatMoney();
  const [filter, setFilter] = useState<Filter>('all');

  const all = useQuery<Product>(`SELECT * FROM products ORDER BY name`);
  const rows = all.filter((p) => {
    if (filter === 'inactive') return !p.active;
    if (filter === 'supplement' || filter === 'other' || filter === 'service') return p.category === filter;
    return true; // 'all' shows active and inactive
  });

  async function remove(id: number) {
    if (await confirmDialog('Delete this product?')) {
      mutate('DELETE FROM products WHERE id=?', [id]);
      toast('Deleted', 'var(--red)');
    }
  }

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Products &amp; Services</div>
          <div className="ps">All sellable products and services</div>
        </div>
        <div className="ph-right">
          <Button variant="primary" onClick={() => openProduct()}>
            + Add Product
          </Button>
        </div>
      </div>

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      <div className="card-flush">
        {rows.length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Sale Price</th>
                  <th>Cost</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>POS</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="td-name">{p.name}</td>
                    <td>{p.category}</td>
                    <td style={{ color: 'var(--green)' }}>{fc(p.sale_price)}</td>
                    <td>{p.cost_price ? fc(p.cost_price) : '—'}</td>
                    <td>{p.track_stock ? p.stock : '—'}</td>
                    <td>{p.track_stock ? p.min_stock : '—'}</td>
                    <td>{p.show_pos ? <Badge className="bg">Yes</Badge> : <Badge className="bn">No</Badge>}</td>
                    <td>{p.active ? <Badge className="bg">Active</Badge> : <Badge className="br">Inactive</Badge>}</td>
                    <td>
                      <div className="td-actions">
                        <Button variant="ghost" size="xs" onClick={() => openProduct(p.id)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="xs" onClick={() => remove(p.id)}>
                          Del
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">🛍️</div>
            No products yet
          </div>
        )}
      </div>
    </>
  );
}
