import { useAppStore } from '../../store/appStore';
import { useFormatMoney } from '../../store/useQuery';
import { useAuthStore } from '../auth/authStore';
import { toast } from '../../store/toastStore';
import { usePosStore } from './posStore';
import { cartTotal, completeSale } from './posLogic';
import type { PaymentMethod } from '../../types';

const PAYMENT_METHODS: { method: PaymentMethod; label: string }[] = [
  { method: 'cash', label: '💵 Cash' },
  { method: 'card', label: '💳 Card' },
  { method: 'transfer', label: '🏦 Transfer' },
  { method: 'other', label: '📱 Other' },
  { method: 'unpaid', label: '⏳ Unpaid' },
  { method: 'free', label: '🎁 Free' },
];

export function CheckoutPanel() {
  const fc = useFormatMoney();
  const currency = useAppStore((s) => s.cfg.currency);
  const staffName = useAuthStore((s) => s.ownerName);

  const cart = usePosStore((s) => s.cart);
  const client = usePosStore((s) => s.client);
  const discount = usePosStore((s) => s.discount);
  const discountType = usePosStore((s) => s.discountType);
  const payment = usePosStore((s) => s.payment);
  const note = usePosStore((s) => s.note);
  const setDiscount = usePosStore((s) => s.setDiscount);
  const setDiscountType = usePosStore((s) => s.setDiscountType);
  const setPayment = usePosStore((s) => s.setPayment);
  const setNote = usePosStore((s) => s.setNote);
  const reset = usePosStore((s) => s.reset);

  const total = cartTotal(cart, discount, discountType);

  function checkout() {
    if (!cart.length) {
      toast('Cart is empty', 'var(--red)');
      return;
    }
    const { total: paid } = completeSale({
      cart,
      client,
      discount,
      discountType,
      paymentMethod: payment,
      note: note.trim(),
      staffName,
      currency,
    });
    toast(`Sale complete! ${fc(paid)} ✓`);
    reset();
  }

  return (
    <div className="cart-footer">
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center', fontSize: 12, color: 'var(--text2)' }}>
        <span style={{ flexShrink: 0 }}>Discount:</span>
        <input
          type="number"
          min={0}
          value={discount || ''}
          placeholder="0"
          style={{ padding: '5px 8px', fontSize: 12 }}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
        />
        <select
          value={discountType}
          style={{ padding: '5px 8px', fontSize: 12 }}
          onChange={(e) => setDiscountType(e.target.value as 'pct' | 'fixed')}
        >
          <option value="pct">%</option>
          <option value="fixed">Fixed</option>
        </select>
      </div>

      <div className="cart-total">
        <span>Total</span>
        <span style={{ color: 'var(--green)' }}>{fc(total)}</span>
      </div>

      <div className="sec-title" style={{ marginBottom: 6, fontSize: 10 }}>
        Payment
      </div>
      <div className="pay-methods">
        {PAYMENT_METHODS.map((p) => (
          <div
            key={p.method}
            className={`pay-btn${payment === p.method ? ' active' : ''}`}
            onClick={() => setPayment(p.method)}
          >
            {p.label}
          </div>
        ))}
      </div>

      <input
        placeholder="Note (optional)"
        value={note}
        style={{ fontSize: 12, padding: '7px 10px', marginBottom: 8 }}
        onChange={(e) => setNote(e.target.value)}
      />
      <button className="complete-btn" onClick={checkout} disabled={!cart.length}>
        Complete Sale
      </button>
    </div>
  );
}
