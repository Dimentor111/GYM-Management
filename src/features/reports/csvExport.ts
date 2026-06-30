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
}

export function exportSalesCSV(): void {
  const rows = query<CsvRow>(
    `SELECT s.sale_date,s.sale_time,s.client_name,si.product_name,si.category,si.qty,si.unit_price,si.total,s.discount,s.final_total,s.payment_method,s.staff_name
     FROM sales s LEFT JOIN sale_items si ON s.id=si.sale_id
     WHERE s.status='completed' ORDER BY s.created_at DESC`,
  );
  const header = 'Date,Time,Client,Product,Category,Qty,Unit Price,Item Total,Discount,Sale Total,Payment,Staff\n';
  const body = rows
    .map(
      (r) =>
        `"${r.sale_date}","${r.sale_time}","${r.client_name || 'Guest'}","${r.product_name || ''}","${r.category || ''}",${r.qty || ''},${r.unit_price || ''},${r.total || ''},${r.discount || 0},${r.final_total},"${r.payment_method}","${r.staff_name || ''}"`,
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
