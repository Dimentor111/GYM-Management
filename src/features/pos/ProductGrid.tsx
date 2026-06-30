import { useAppStore } from '../../store/appStore';
import { useQuery, useFormatMoney } from '../../store/useQuery';
import { toast } from '../../store/toastStore';
import { usePosStore } from './posStore';
import { EmptyState } from '../../components/common/EmptyState';
import type { CartItem, MembershipPlan, Product } from '../../types';

export function ProductGrid() {
  const fc = useFormatMoney();
  const categories = useAppStore((s) => s.cfg.categories);
  const activeCat = usePosStore((s) => s.category);
  const setCategory = usePosStore((s) => s.setCategory);
  const addItem = usePosStore((s) => s.addItem);

  const plans = useQuery<MembershipPlan>(`SELECT * FROM membership_plans WHERE active=1 AND show_pos=1`);
  const products = useQuery<Product>(`SELECT * FROM products WHERE active=1 AND show_pos=1`);

  const items: (Omit<CartItem, 'qty'> & { stockTracked: boolean; stockQty: number })[] = [
    ...plans.map((p) => ({
      id: 'p' + p.id,
      name: p.name,
      price: p.price,
      cat: 'Membership',
      type: 'plan' as const,
      rid: p.id,
      stockTracked: false,
      stockQty: 0,
    })),
    ...products.map((p) => ({
      id: 'r' + p.id,
      name: p.name,
      price: p.sale_price,
      cat: p.category,
      type: 'product' as const,
      rid: p.id,
      track_stock: !!p.track_stock,
      stock: p.stock,
      stockTracked: !!p.track_stock,
      stockQty: p.stock,
    })),
  ];

  const filtered =
    activeCat === 'all' ? items : items.filter((i) => i.cat.toLowerCase() === activeCat.toLowerCase());

  const catTabs = ['all', ...categories];

  function add(item: (typeof items)[number]) {
    const { stockTracked, stockQty, ...cartItem } = item;
    void stockTracked;
    void stockQty;
    addItem(cartItem);
    toast(item.name + ' added ✓');
  }

  return (
    <div className="pos-left">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>New Sale</span>
        <span className="ts">{new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div className="pos-cats">
        {catTabs.map((c) => (
          <div key={c} className={`pos-cat${activeCat === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
            {c === 'all' ? 'All' : c}
          </div>
        ))}
      </div>

      <div className="pos-products">
        {filtered.length ? (
          filtered.map((i) => (
            <div className="pos-product" key={i.id} onClick={() => add(i)}>
              <div className="pos-product-name">{i.name}</div>
              <div className="pos-product-price">{fc(i.price)}</div>
              <div className="pos-product-cat">{i.cat}</div>
              {i.stockTracked && <div className="pos-product-stock">Stock: {i.stockQty}</div>}
            </div>
          ))
        ) : (
          <EmptyState icon="🛍️" style={{ gridColumn: '1/-1' }}>
            No products in this category
          </EmptyState>
        )}
      </div>
    </div>
  );
}
