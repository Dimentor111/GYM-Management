/**
 * Audit-safe void / return of an individual sale line item.
 *
 * Nothing is hard-deleted: the sale and its line items are preserved. The
 * targeted line item is flagged (`status`, `deleted_at`, `deleted_by`,
 * `delete_reason`, `returned_to_stock`) and the side effects are applied
 * atomically:
 *   - tracked inventory stock is restored only when the staff opts to;
 *   - membership(s) created by a voided/returned plan line are cancelled;
 *   - an activity-log entry records who/when/why.
 *
 * This is a service function so the audit logic lives outside the UI.
 */
import { batch, mutate, query } from '../../data/db';
import { nowISO } from '../../utils/dates';
import type { Membership, Product, Sale, SaleItem } from '../../types';

export type AdjustmentType = 'returned' | 'voided';

export interface VoidSaleItemInput {
  saleItemId: number;
  type: AdjustmentType;
  reason: string;
  /** Staff member performing the action (the logged-in user). */
  staffName: string;
  /** Only meaningful for stock-tracked products. */
  returnToStock: boolean;
}

/** Reasons that imply the item should NOT go back into sellable stock. */
const DEFECTIVE_PATTERN = /\b(defect|damag|expir|unusable|unuseable|broken|spoil|faulty|contaminat)/i;

export function isDefectiveReason(reason: string): boolean {
  return DEFECTIVE_PATTERN.test(reason);
}

/** Suggested default for the "return to inventory?" toggle. */
export function suggestReturnToStock(reason: string): boolean {
  return !isDefectiveReason(reason);
}

export function voidSaleItem(input: VoidSaleItemInput): void {
  const reason = input.reason.trim();
  if (!reason) throw new Error('A reason note is required');

  const item = query<SaleItem>('SELECT * FROM sale_items WHERE id=?', [input.saleItemId])[0];
  if (!item) throw new Error('Sale item not found');

  const currentStatus = item.status ?? 'active';
  if (currentStatus !== 'active') {
    throw new Error(`This item was already ${currentStatus}`);
  }

  const sale = query<Sale>('SELECT * FROM sales WHERE id=?', [item.sale_id])[0];
  if (!sale) throw new Error('Parent sale not found');

  const restoreStock = item.item_type === 'product' && input.returnToStock;
  const now = nowISO();

  batch(() => {
    // 1. Flag the line item (audit trail preserved).
    mutate(
      `UPDATE sale_items SET status=?, deleted_at=?, deleted_by=?, delete_reason=?, returned_to_stock=? WHERE id=?`,
      [input.type, now, input.staffName, reason, restoreStock ? 1 : 0, input.saleItemId],
    );

    // 2. Inventory: restore stock for tracked products when requested.
    if (restoreStock && item.ref_id) {
      const product = query<Product>('SELECT * FROM products WHERE id=?', [item.ref_id])[0];
      // If the product was deleted we simply skip restock (still fully voided).
      if (product && product.track_stock) {
        mutate('UPDATE products SET stock=stock+? WHERE id=?', [item.qty, product.id]);
        mutate(
          'INSERT INTO stock_movements(product_id,product_name,type,qty,notes,created_at) VALUES(?,?,?,?,?,?)',
          [product.id, product.name, 'return', item.qty, `${labelFor(input.type)} of sale #${item.sale_id}: ${reason}`, now],
        );
      }
    }

    // 3. Membership: cancel any membership(s) created by this plan line item.
    if (item.item_type === 'plan' && item.ref_id) {
      const memberships = query<Membership>(
        `SELECT * FROM memberships WHERE sale_id=? AND plan_id=? AND status<>'canceled'`,
        [item.sale_id, item.ref_id],
      );
      for (const m of memberships) {
        const stamp = `[${labelFor(input.type)} ${now.slice(0, 10)}: ${reason}]`;
        const notes = m.notes ? `${m.notes} ${stamp}` : stamp;
        mutate(`UPDATE memberships SET status='canceled', updated_at=?, notes=? WHERE id=?`, [now, notes, m.id]);
      }
    }

    // 4. Audit log.
    mutate('INSERT INTO activity_logs(staff_name,action,details,created_at) VALUES(?,?,?,?)', [
      input.staffName,
      input.type === 'returned' ? 'return' : 'void',
      `${item.item_type === 'plan' ? 'Membership' : 'Product'} "${item.product_name}" x${item.qty} (${item.total}) from sale #${item.sale_id}` +
        `${sale.payment_method ? ` [${sale.payment_method}]` : ''} — ${reason}`,
      now,
    ]);
  });
}

function labelFor(type: AdjustmentType): string {
  return type === 'returned' ? 'Return' : 'Void';
}
