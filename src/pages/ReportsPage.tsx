import { useState } from 'react';
import { useQuery, useScalar, useFormatMoney } from '../store/useQuery';
import { exportSalesCSV } from '../features/reports/csvExport';
import {
  groupItems,
  isActiveSaleItem,
  netByPayment,
  netByStaff,
  sortedByRevenue,
  sumItemTotals,
  totalIncome,
} from '../features/reports/reportUtils';
import { daysInMonth, formatDate, MONTH_ABBR, MONTH_NAMES, todayISO } from '../utils/dates';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { BarChart } from '../components/common/BarChart';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import type { ReportType, Sale, SaleItem } from '../types';

/** A sale line item joined with the fields from its parent sale. */
type SaleItemRow = SaleItem & {
  payment_method: string | null;
  staff_name: string | null;
  sale_date: string;
  client_name?: string | null;
  sale_time?: string;
};

const ITEM_SELECT_DETAILED = `SELECT si.*, s.payment_method, s.staff_name, s.client_name, s.sale_time, s.sale_date
  FROM sale_items si JOIN sales s ON si.sale_id=s.id`;

export function ReportsPage() {
  const now = new Date();
  const [type, setType] = useState<ReportType>('daily');
  const [date, setDate] = useState(todayISO());
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Reports</div>
          <div className="ps">Business analytics and financials</div>
        </div>
        <div className="ph-right">
          <select value={type} onChange={(e) => setType(e.target.value as ReportType)} style={{ width: 150 }}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          {type === 'daily' && (
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 148 }} />
          )}
          {type === 'monthly' && (
            <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 128 }}>
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={String(i + 1).padStart(2, '0')}>
                  {name}
                </option>
              ))}
            </select>
          )}
          {type !== 'daily' && (
            <input
              type="number"
              value={year}
              min={2020}
              max={2099}
              onChange={(e) => setYear(e.target.value)}
              style={{ width: 88 }}
            />
          )}
          <Button variant="ghost" size="sm" onClick={exportSalesCSV}>
            📊 CSV
          </Button>
        </div>
      </div>

      {type === 'daily' && <DailyReport date={date || todayISO()} />}
      {type === 'monthly' && <MonthlyReport month={month} year={year || String(now.getFullYear())} />}
      {type === 'yearly' && <YearlyReport year={year || String(now.getFullYear())} />}
    </>
  );
}

function ReportList({ entries, total }: { entries: [string, string][]; total?: string }) {
  if (!entries.length) return <div className="empty" style={{ padding: 16 }}>No sales</div>;
  return (
    <>
      {entries.map(([label, value]) => (
        <div className="report-row" key={label}>
          <span className="lbl">{label}</span>
          <span className="val">{value}</span>
        </div>
      ))}
      {total !== undefined && (
        <div className="report-total">
          <span>Total</span>
          <span style={{ color: 'var(--green)' }}>{total}</span>
        </div>
      )}
    </>
  );
}

/** Gross / returns / net summary plus an itemized returns-&-voids table. */
function ReturnsSummary({
  gross,
  adjustments,
  fc,
}: {
  gross: number;
  adjustments: SaleItemRow[];
  fc: (n: number) => string;
}) {
  const returns = sumItemTotals(adjustments);
  const net = gross - returns;
  return (
    <div className="two-col" style={{ marginBottom: 14 }}>
      <div className="card">
        <div className="card-title">Sales Summary</div>
        <div className="report-row">
          <span className="lbl">Gross Sales</span>
          <span className="val">{fc(gross)}</span>
        </div>
        <div className="report-row">
          <span className="lbl">Returns / Voids</span>
          <span className="val" style={{ color: returns > 0 ? 'var(--red)' : undefined }}>
            {returns > 0 ? `−${fc(returns)}` : fc(0)}
          </span>
        </div>
        <div className="report-total">
          <span>Net Sales</span>
          <span style={{ color: 'var(--green)' }}>{fc(net)}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Returns &amp; Voids {adjustments.length > 0 && <Badge className="br">{adjustments.length}</Badge>}
        </div>
        {adjustments.length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>By</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id}>
                    <td className="td-name">
                      {a.product_name} <Badge className="bn">{a.status}</Badge>
                    </td>
                    <td>{a.qty}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 600 }}>−{fc(a.total)}</td>
                    <td>{a.delete_reason || '—'}</td>
                    <td>{a.deleted_by || '—'}</td>
                    <td className="ts">{formatDate(a.deleted_at?.slice(0, 10))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="↩️">No returns or voids</EmptyState>
        )}
      </div>
    </div>
  );
}

function DailyReport({ date }: { date: string }) {
  const fc = useFormatMoney();
  const sales = useQuery<Sale>(`SELECT * FROM sales WHERE sale_date=? AND status='completed'`, [date]);
  const itemRows = useQuery<SaleItemRow>(`${ITEM_SELECT_DETAILED} WHERE s.sale_date=? AND s.status='completed'`, [date]);
  const visits = useScalar<number>(`SELECT COUNT(*) FROM visits WHERE visit_date=?`, [date]) ?? 0;
  const newClients = useScalar<number>(`SELECT COUNT(*) FROM clients WHERE created_at LIKE ?`, [date + '%']) ?? 0;

  const activeItems = itemRows.filter(isActiveSaleItem);
  const adjustments = itemRows.filter((i) => !isActiveSaleItem(i));
  const gross = totalIncome(sales);
  const net = gross - sumItemTotals(adjustments);
  const byCat = groupItems(activeItems, 'category');
  const byPay = netByPayment(sales, adjustments);
  const byStaff = netByStaff(sales, adjustments);
  const byProduct = groupItems(activeItems, 'product_name');

  return (
    <>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <StatCard color="g" label="Net Income" value={fc(net)} valueStyle={{ fontSize: 20 }} />
        <StatCard color="b" label="Sales" value={sales.length} />
        <StatCard color="c" label="Visits" value={visits} />
        <StatCard color="a" label="New Clients" value={newClients} />
      </div>

      <ReturnsSummary gross={gross} adjustments={adjustments} fc={fc} />

      <div className="three-col" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-title">By Category</div>
          <ReportList entries={Object.entries(byCat).map(([c, d]) => [c, fc(d.total)])} total={fc(net)} />
        </div>
        <div className="card">
          <div className="card-title">By Payment Method</div>
          <ReportList entries={Object.entries(byPay).map(([p, a]) => [p, fc(a)])} />
        </div>
        <div className="card">
          <div className="card-title">By Staff</div>
          <ReportList entries={Object.entries(byStaff).map(([n, a]) => [n, fc(a)])} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title">Products Sold</div>
        {Object.keys(byProduct).length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedByRevenue(byProduct).map(([name, d]) => (
                  <tr key={name}>
                    <td className="td-name">{name}</td>
                    <td>{d.qty}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fc(d.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty" style={{ padding: 16 }}>No products sold</div>
        )}
      </div>

      {sales.length > 0 && (
        <div className="card">
          <div className="card-title">All Transactions — {formatDate(date)}</div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Client</th>
                  <th>Items</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => {
                  const lineItems = itemRows.filter((i) => i.sale_id === s.id);
                  return (
                    <tr key={s.id}>
                      <td className="ts">{s.sale_time}</td>
                      <td>{s.client_name || 'Guest'}</td>
                      <td>
                        {lineItems
                          .map(
                            (i) =>
                              i.product_name +
                              (i.qty > 1 ? ` ×${i.qty}` : '') +
                              (isActiveSaleItem(i) ? '' : ` (${i.status})`),
                          )
                          .join(', ')}
                      </td>
                      <td>{s.discount > 0 ? fc(s.discount) : '—'}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fc(s.final_total)}</td>
                      <td>{s.payment_method}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function MonthlyReport({ month, year }: { month: string; year: string }) {
  const fc = useFormatMoney();
  const prefix = `${year}-${month}`;
  const sales = useQuery<Sale>(`SELECT * FROM sales WHERE sale_date LIKE ? AND status='completed'`, [prefix + '%']);
  const itemRows = useQuery<SaleItemRow>(`${ITEM_SELECT_DETAILED} WHERE s.sale_date LIKE ? AND s.status='completed'`, [prefix + '%']);
  const visits = useScalar<number>(`SELECT COUNT(*) FROM visits WHERE visit_date LIKE ?`, [prefix + '%']) ?? 0;
  const newClients = useScalar<number>(`SELECT COUNT(*) FROM clients WHERE created_at LIKE ?`, [prefix + '%']) ?? 0;

  const activeItems = itemRows.filter(isActiveSaleItem);
  const adjustments = itemRows.filter((i) => !isActiveSaleItem(i));
  const gross = totalIncome(sales);
  const net = gross - sumItemTotals(adjustments);
  const byCat = groupItems(activeItems, 'category');
  const byProduct = groupItems(activeItems, 'product_name');
  const monthIndex = parseInt(month, 10) - 1;
  const totalDays = daysInMonth(parseInt(year, 10), parseInt(month, 10));
  const daily = Array.from({ length: totalDays }, (_, i) => {
    const dt = `${prefix}-${String(i + 1).padStart(2, '0')}`;
    const grossDay = sales.filter((s) => s.sale_date === dt).reduce((sum, s) => sum + s.final_total, 0);
    const returnsDay = sumItemTotals(adjustments.filter((a) => a.sale_date === dt));
    return grossDay - returnsDay;
  });

  return (
    <>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <StatCard color="g" label={`${MONTH_NAMES[monthIndex]} Net Income`} value={fc(net)} valueStyle={{ fontSize: 20 }} />
        <StatCard color="b" label="Total Sales" value={sales.length} />
        <StatCard color="c" label="Visits" value={visits} />
        <StatCard color="a" label="New Clients" value={newClients} />
      </div>

      <ReturnsSummary gross={gross} adjustments={adjustments} fc={fc} />

      <div className="two-col" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-title">Daily Net Income — {MONTH_NAMES[monthIndex]} {year}</div>
          <BarChart bars={daily.map((value, i) => ({ label: String(i + 1), value }))} barMax={72} minActive={3} />
        </div>
        <div className="card">
          <div className="card-title">By Category</div>
          <ReportList
            entries={Object.entries(byCat).map(([c, d]) => [`${c} (${d.qty} units)`, fc(d.total)])}
            total={fc(net)}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Top Selling Products</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {sortedByRevenue(byProduct).slice(0, 10).map(([name, d]) => (
                <tr key={name}>
                  <td className="td-name">{name}</td>
                  <td>{d.qty}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fc(d.total)}</td>
                </tr>
              ))}
              {!Object.keys(byProduct).length && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function YearlyReport({ year }: { year: string }) {
  const fc = useFormatMoney();
  const yearSales = useQuery<Pick<Sale, 'sale_date' | 'final_total'>>(
    `SELECT sale_date, final_total FROM sales WHERE sale_date LIKE ? AND status='completed'`,
    [year + '%'],
  );
  const itemRows = useQuery<SaleItemRow>(`${ITEM_SELECT_DETAILED} WHERE s.sale_date LIKE ? AND s.status='completed'`, [year + '%']);
  const yearVisits = useQuery<{ visit_date: string }>(`SELECT visit_date FROM visits WHERE visit_date LIKE ?`, [year + '%']);
  const newClients = useScalar<number>(`SELECT COUNT(*) FROM clients WHERE created_at LIKE ?`, [year + '%']) ?? 0;

  const adjustments = itemRows.filter((i) => !isActiveSaleItem(i));

  const data = MONTH_ABBR.map((n, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, '0')}`;
    const monthSales = yearSales.filter((s) => s.sale_date.startsWith(prefix));
    const grossMonth = monthSales.reduce((sum, s) => sum + s.final_total, 0);
    const returnsMonth = sumItemTotals(adjustments.filter((a) => a.sale_date.startsWith(prefix)));
    return {
      n,
      inc: grossMonth - returnsMonth,
      sales: monthSales.length,
      vis: yearVisits.filter((v) => v.visit_date.startsWith(prefix)).length,
    };
  });

  const gross = yearSales.reduce((s, x) => s + x.final_total, 0);
  const net = data.reduce((s, d) => s + d.inc, 0);
  const totalSales = data.reduce((s, d) => s + d.sales, 0);
  const top = data.reduce((a, b) => (a.inc > b.inc ? a : b));

  return (
    <>
      <div className="grid g4" style={{ marginBottom: 16 }}>
        <StatCard color="g" label={`Net ${year} Income`} value={fc(net)} valueStyle={{ fontSize: 18 }} />
        <StatCard color="b" label="Total Sales" value={totalSales} />
        <StatCard color="c" label="Total Visits" value={yearVisits.length} />
        <StatCard color="a" label="New Clients" value={newClients} />
      </div>

      <ReturnsSummary gross={gross} adjustments={adjustments} fc={fc} />

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title">
          Monthly Net Income — {year}
          {net > 0 && (
            <>
              {' '}&nbsp;·&nbsp; Best: <span style={{ color: 'var(--green)' }}>{top.n} ({fc(top.inc)})</span>
            </>
          )}
        </div>
        <BarChart
          bars={data.map((d) => ({ label: d.n, value: d.inc, highlight: net > 0 && d.n === top.n }))}
          height={100}
          barMax={88}
        />
      </div>

      <div className="card">
        <div className="card-title">Month Breakdown — {year}</div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Sales</th>
                <th>Visits</th>
                <th>Net Income</th>
              </tr>
            </thead>
            <tbody>
              {data.filter((d) => d.inc !== 0 || d.sales > 0).map((d) => (
                <tr key={d.n}>
                  <td className="td-name">{d.n} {year}</td>
                  <td>{d.sales}</td>
                  <td>{d.vis}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fc(d.inc)}</td>
                </tr>
              ))}
              {!data.some((d) => d.inc !== 0 || d.sales > 0) && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text3)', padding: 20 }}>
                    No income data for {year}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="report-total">
          <span>Net Total {year}</span>
          <span style={{ color: 'var(--green)' }}>{fc(net)}</span>
        </div>
      </div>
    </>
  );
}
