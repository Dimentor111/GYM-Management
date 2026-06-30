/**
 * POS checkout. A single transactional operation that, on completion:
 *  - records the sale and its line items;
 *  - creates membership records when a plan is sold to an attached client;
 *  - deducts tracked inventory stock and logs the movement;
 *  - writes an activity log entry.
 *
 * All writes are batched into one persist + notify, so the dashboard, reports
 * and inventory update together once.
 */
import { batch, lastInsertId, mutate, query } from '../../data/db';
import { addDays, nowISO, nowTime, todayISO } from '../../utils/dates';
import { discountAmount, formatMoney } from '../../utils/money';
import type { CartItem, DiscountType, MembershipPlan, PaymentMethod } from '../../types';

export interface CheckoutClient {
  id: number;
  name: string;
}

export interface CheckoutInput {
  cart: CartItem[];
  client: CheckoutClient | null;
  discount: number;
  discountType: DiscountType;
  paymentMethod: PaymentMethod;
  note: string;
  staffName: string;
  currency: string;
}

export interface CheckoutResult {
  saleId: number;
  total: number;
}

export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function cartTotal(cart: CartItem[], discount: number, type: DiscountType): number {
  const subtotal = cartSubtotal(cart);
  return Math.max(0, subtotal - discountAmount(subtotal, discount, type));
}

export function completeSale(input: CheckoutInput): CheckoutResult {
  const { cart, client, discount, discountType, paymentMethod, note, staffName, currency } = input;
  const subtotal = cartSubtotal(cart);
  const da = discountAmount(subtotal, discount, discountType);
  const total = Math.max(0, subtotal - da);
  const saleDate = todayISO();
  const saleTime = nowTime();
  const now = nowISO();

  let saleId = 0;
  batch(() => {
    mutate(
      `INSERT INTO sales(client_id,client_name,total,discount,discount_type,final_total,payment_method,staff_name,status,notes,sale_date,sale_time,created_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        client?.id ?? null,
        client?.name ?? null,
        subtotal,
        da,
        discountType,
        total,
        paymentMethod,
        staffName,
        'completed',
        note,
        saleDate,
        saleTime,
        now,
      ],
    );
    saleId = lastInsertId();

    for (const item of cart) {
      mutate(
        `INSERT INTO sale_items(sale_id,product_name,category,qty,unit_price,total,item_type,ref_id)
         VALUES(?,?,?,?,?,?,?,?)`,
        [saleId, item.name, item.cat, item.qty, item.price, item.price * item.qty, item.type, item.rid],
      );

      // Selling a membership plan to an attached client creates real membership cards.
      if (item.type === 'plan' && client) {
        const plan = query<MembershipPlan>(`SELECT * FROM membership_plans WHERE id=?`, [item.rid])[0];
        if (plan) {
          for (let i = 0; i < item.qty; i++) {
            const endDate = addDays(saleDate, plan.duration_days);
            mutate(
              `INSERT INTO memberships(client_id,plan_id,plan_name,client_name,price,start_date,end_date,total_visits,visits_used,status,payment_method,staff_name,sale_id,notes,created_at,updated_at)
               VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                client.id,
                plan.id,
                plan.name,
                client.name,
                plan.price,
                saleDate,
                endDate,
                plan.total_visits || 0,
                0,
                'active',
                paymentMethod,
                staffName,
                saleId,
                note,
                now,
                now,
              ],
            );
          }
        }
      }

      // Selling a stock-tracked product deducts inventory and logs the movement.
      if (item.type === 'product' && item.track_stock) {
        mutate(`UPDATE products SET stock=MAX(0,stock-?) WHERE id=?`, [item.qty, item.rid]);
        mutate(
          `INSERT INTO stock_movements(product_id,product_name,type,qty,notes,created_at) VALUES(?,?,?,?,?,?)`,
          [item.rid, item.name, 'sale', -item.qty, 'Sale #' + saleId, now],
        );
      }
    }

    mutate(`INSERT INTO activity_logs(staff_name,action,details,created_at) VALUES(?,?,?,?)`, [
      staffName,
      'sale',
      `Sale #${saleId} ${formatMoney(total, currency)}`,
      now,
    ]);
  });

  return { saleId, total };
}
