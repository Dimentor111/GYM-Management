import { useModalStore } from '../store/modalStore';
import { useQuery, useFormatMoney } from '../store/useQuery';
import { stockStatus } from '../features/inventory/inventoryUtils';
import { profitMargin } from '../utils/money';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import type { Product } from '../types';

export function InventoryPage() {
  const openRestock = useModalStore((s) => s.openRestock);
  const openProduct = useModalStore((s) => s.openProduct);
  const fc = useFormatMoney();

  const rows = useQuery<Product>(`SELECT * FROM products WHERE track_stock=1 ORDER BY name`);

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Inventory</div>
          <div className="ps">Stock levels and product tracking</div>
        </div>
        <div className="ph-right">
          <Button variant="ghost" size="sm" onClick={() => openRestock()}>
            + Restock
          </Button>
          <Button variant="primary" onClick={() => openProduct()}>
            + Add Product
          </Button>
        </div>
      </div>

      <div className="card-flush">
        {rows.length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Min</th>
                  <th>Sale Price</th>
                  <th>Cost</th>
                  <th>Margin</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const stk = stockStatus(p);
                  const margin = profitMargin(p.sale_price, p.cost_price);
                  return (
                    <tr key={p.id}>
                      <td className="td-name">{p.name}</td>
                      <td>{p.category}</td>
                      <td>
                        <div>{p.stock}</div>
                        <div className="inv-bar">
                          <div className="inv-fill" style={{ width: `${stk.pct}%`, background: stk.color }} />
                        </div>
                      </td>
                      <td>{p.min_stock}</td>
                      <td style={{ color: 'var(--green)' }}>{fc(p.sale_price)}</td>
                      <td>{p.cost_price ? fc(p.cost_price) : '—'}</td>
                      <td>{margin !== null ? `${margin}%` : '—'}</td>
                      <td>
                        <Badge className={stk.badgeClass}>{stk.label}</Badge>
                      </td>
                      <td>
                        <Button variant="ghost" size="xs" onClick={() => openRestock(p.id)}>
                          + Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">📦</div>
            No tracked products
          </div>
        )}
      </div>
    </>
  );
}
