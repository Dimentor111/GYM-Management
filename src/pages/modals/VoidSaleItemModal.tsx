import { useEffect, useState } from 'react';
import { useModalStore } from '../../store/modalStore';
import { useAuthStore } from '../../features/auth/authStore';
import { useFormatMoney } from '../../store/useQuery';
import { query } from '../../data/db';
import { toast } from '../../store/toastStore';
import {
  suggestReturnToStock,
  voidSaleItem,
  type AdjustmentType,
} from '../../features/sales/saleAdjustments';
import { formatDate } from '../../utils/dates';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Field } from '../../components/common/Field';
import type { Product, Sale, SaleItem } from '../../types';

export function VoidSaleItemModal() {
  const { open, saleItemId } = useModalStore((s) => s.voidItem);
  const close = useModalStore((s) => s.closeVoidItem);
  const staffName = useAuthStore((s) => s.ownerName);
  const fc = useFormatMoney();

  const [item, setItem] = useState<SaleItem | null>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [membershipCount, setMembershipCount] = useState(0);

  const [type, setType] = useState<AdjustmentType>('returned');
  const [reason, setReason] = useState('');
  const [returnToStock, setReturnToStock] = useState(true);
  const [stockTouched, setStockTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !saleItemId) return;
    const it = query<SaleItem>('SELECT * FROM sale_items WHERE id=?', [saleItemId])[0] ?? null;
    setItem(it);
    setSale(it ? query<Sale>('SELECT * FROM sales WHERE id=?', [it.sale_id])[0] ?? null : null);
    setProduct(
      it && it.item_type === 'product' && it.ref_id
        ? query<Product>('SELECT * FROM products WHERE id=?', [it.ref_id])[0] ?? null
        : null,
    );
    setMembershipCount(
      it && it.item_type === 'plan' && it.ref_id
        ? query<{ n: number }>(
            `SELECT COUNT(*) AS n FROM memberships WHERE sale_id=? AND plan_id=? AND status<>'canceled'`,
            [it.sale_id, it.ref_id],
          )[0]?.n ?? 0
        : 0,
    );
    // Reset the form each time the modal opens.
    setType('returned');
    setReason('');
    setReturnToStock(true);
    setStockTouched(false);
    setBusy(false);
  }, [open, saleItemId]);

  const tracksStock = !!(product && product.track_stock);
  const alreadyHandled = !!item && (item.status ?? 'active') !== 'active';

  function onReasonChange(value: string) {
    setReason(value);
    // Auto-suggest the inventory choice from the reason until staff overrides it.
    if (tracksStock && !stockTouched) setReturnToStock(suggestReturnToStock(value));
  }

  function confirm() {
    if (!item) return;
    setBusy(true);
    try {
      voidSaleItem({
        saleItemId: item.id,
        type,
        reason,
        staffName,
        returnToStock: tracksStock && returnToStock,
      });
      toast(type === 'returned' ? 'Item returned ✓' : 'Item voided ✓');
      close();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action failed', 'var(--red)');
      setBusy(false);
    }
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={close}>
        Cancel
      </Button>
      <Button variant="danger" onClick={confirm} disabled={busy || alreadyHandled || !reason.trim()}>
        {type === 'returned' ? 'Confirm Return' : 'Confirm Void'}
      </Button>
    </>
  );

  return (
    <Modal open={open} title="Return / Void Item" onClose={close} footer={footer}>
      {!item ? (
        <div className="empty">
          <div className="empty-icon">⚠️</div>
          Sale item not found.
        </div>
      ) : (
        <>
          {alreadyHandled && (
            <div className="auth-err" style={{ marginBottom: 14 }}>
              This item was already {item.status}. No further action is possible.
            </div>
          )}

          <div className="grid g2" style={{ marginBottom: 14 }}>
            <Detail label="Item" value={item.product_name} big />
            <Detail label="Category" value={item.category} />
            <Detail label="Quantity" value={String(item.qty)} />
            <Detail label="Amount" value={fc(item.total)} green />
            <Detail label="Unit Price" value={fc(item.unit_price)} />
            <Detail label="Sold" value={`${formatDate(sale?.sale_date)} ${sale?.sale_time ?? ''}`.trim()} />
            <Detail label="Staff" value={sale?.staff_name || '—'} />
            <Detail label="Payment" value={sale?.payment_method || '—'} />
          </div>

          {item.item_type === 'plan' && (
            <div
              style={{
                background: 'var(--amberbg)',
                border: '1px solid var(--amberborder)',
                color: 'var(--amber)',
                borderRadius: 'var(--r)',
                padding: '9px 13px',
                fontSize: 12,
                marginBottom: 14,
              }}
            >
              🎫 This is a membership sale. Confirming will cancel{' '}
              {membershipCount > 0 ? `${membershipCount} related membership(s)` : 'any related membership'} so check-in
              no longer treats it as active.
            </div>
          )}

          {!alreadyHandled && (
            <>
              <Field label="Action *">
                <select value={type} onChange={(e) => setType(e.target.value as AdjustmentType)}>
                  <option value="returned">Return (client gave the item back)</option>
                  <option value="voided">Void (mistake / cancellation)</option>
                </select>
              </Field>

              <Field label="Reason / Note *" hint="Required — e.g. “Product was defective.”">
                <textarea
                  value={reason}
                  placeholder="Why is this item being returned or voided?"
                  onChange={(e) => onReasonChange(e.target.value)}
                />
              </Field>

              {item.item_type === 'product' && (
                tracksStock ? (
                  <div className="checkbox-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={returnToStock}
                        onChange={(e) => {
                          setStockTouched(true);
                          setReturnToStock(e.target.checked);
                        }}
                      />{' '}
                      Return item to inventory?
                    </label>
                  </div>
                ) : (
                  <div className="hint">This product is not stock-tracked, so inventory is unchanged.</div>
                )
              )}
            </>
          )}
        </>
      )}
    </Modal>
  );
}

function Detail({ label, value, big, green }: { label: string; value: string; big?: boolean; green?: boolean }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div
        style={{
          fontWeight: big ? 700 : 600,
          fontSize: big ? 15 : undefined,
          color: green ? 'var(--green)' : undefined,
          marginTop: 3,
        }}
      >
        {value}
      </div>
    </div>
  );
}
