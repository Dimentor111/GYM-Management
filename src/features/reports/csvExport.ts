/** CSV export of all completed sales (one row per line item). */
import { query } from '../../data/db';
import { todayISO } from '../../utils/dates';

interface CsvRow {
  sale_date: string;
  sale_time: string;
  client_name: string | null;
  product_name: string | null;
  category: string | null;
  qty: number | null;
  unit_price: number | null;
  total: number | null;
  discount: number | null;
  final_total: number;
  payment_method: string;
  staff_name: string | null;
  item_status: string | null;
  delete_reason: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  returned_to_stock: number | null;
}

/** Escape a value for CSV (wrap in quotes, double embedded quotes). */
function csv(value: string | null | undefined): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function exportSalesCSV(): void {
  const rows = query<CsvRow>(
    `SELECT s.sale_date,s.sale_time,s.client_name,si.product_name,si.category,si.qty,si.unit_price,si.total,s.discount,s.final_total,s.payment_method,s.staff_name,
            si.status AS item_status, si.delete_reason, si.deleted_at, si.deleted_by, si.returned_to_stock
     FROM sales s LEFT JOIN sale_items si ON s.id=si.sale_id
     WHERE s.status='completed' ORDER BY s.created_at DESC`,
  );
  const header =
    'Date,Time,Client,Product,Category,Qty,Unit Price,Item Total,Discount,Sale Total,Payment,Staff,Item Status,Reason,Deleted At,Deleted By,Returned To Stock\n';
  const body = rows
    .map((r) =>
      [
        csv(r.sale_date),
        csv(r.sale_time),
        csv(r.client_name || 'Guest'),
        csv(r.product_name),
        csv(r.category),
        r.qty ?? '',
        r.unit_price ?? '',
        r.total ?? '',
        r.discount || 0,
        r.final_total,
        csv(r.payment_method),
        csv(r.staff_name),
        csv(r.item_status || 'active'),
        csv(r.delete_reason),
        csv(r.deleted_at),
        csv(r.deleted_by),
        r.returned_to_stock ? 'Yes' : 'No',
      ].join(','),
    )
    .join('\n');

  const blob = new Blob([header + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GymPro_Sales_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
