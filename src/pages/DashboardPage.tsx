import { useAppStore } from '../store/appStore';
import { useModalStore } from '../store/modalStore';
import { useQuery, useScalar, useFormatMoney } from '../store/useQuery';
import { membershipStatus } from '../features/memberships/membershipUtils';
import { isActiveSaleItem } from '../features/reports/reportUtils';
import { todayISO, formatDate } from '../utils/dates';
import { firstLetter, initials } from '../utils/validation';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge, Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { BarChart } from '../components/common/BarChart';
import type { Membership, Product, Sale, SaleItem, Visit } from '../types';

const QUICK_ACTIONS = [
  { icon: '💳', label: 'New Sale', action: 'pos' as const },
  { icon: '👤', label: 'New Client', action: 'newClient' as const },
  { icon: '✅', label: 'Check-In', action: 'checkin' as const },
  { icon: '🎫', label: 'Memberships', action: 'memberships' as const },
  { icon: '📊', label: 'Reports', action: 'reports' as const },
  { icon: '📦', label: 'Inventory', action: 'inventory' as const },
];

const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function DashboardPage() {
  const setRoute = useAppStore((s) => s.setRoute);
  const openClient = useModalStore((s) => s.openClient);
  const openVoidItem = useModalStore((s) => s.openVoidItem);
  const fc = useFormatMoney();
  const today = todayISO();
  const year = new Date().getFullYear();

  const todaySales = useQuery<Sale>(`SELECT * FROM sales WHERE sale_date=? AND status='completed'`, [today]);
  const todayVisits = useQuery<Visit>(`SELECT * FROM visits WHERE visit_date=?`, [today]);
  const allMemberships = useQuery<Membership>(`SELECT * FROM memberships`);
  const totalClients = useScalar<number>('SELECT COUNT(*) FROM clients') ?? 0;
  const todayItems = useQuery<SaleItem>(
    `SELECT si.* FROM sale_items si JOIN sales s ON si.sale_id=s.id WHERE s.sale_date=? AND s.status='completed'`,
    [today],
  );
  const lowStock = useQuery<Product>(
    `SELECT * FROM products WHERE track_stock=1 AND active=1 AND stock<=min_stock`,
  );
  const yearSales = useQuery<Pick<Sale, 'sale_date' | 'final_total'>>(
    `SELECT sale_date, final_total FROM sales WHERE sale_date LIKE ? AND status='completed'`,
    [`${year}%`],
  );

  // Active line items drive the breakdown; voided/returned ones are excluded
  // from breakdown + income and shown only as a small awareness note.
  const activeItems = todayItems.filter(isActiveSaleItem);
  const adjustments = todayItems.filter((i) => !isActiveSaleItem(i));
  const grossIncome = todaySales.reduce((s, x) => s + x.final_total, 0);
  const returnsTotal = adjustments.reduce((s, i) => s + i.total, 0);
  const netIncome = grossIncome - returnsTotal;

  const activeM = allMemberships.filter((m) => membershipStatus(m) === 'active').length;
  const expiringList = allMemberships.filter((m) => membershipStatus(m) === 'expiring');

  const monthlyTotals = MONTH_LETTERS.map((_, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, '0')}`;
    return yearSales.filter((s) => s.sale_date.startsWith(prefix)).reduce((sum, s) => sum + s.final_total, 0);
  });
  const yearTotal = monthlyTotals.reduce((s, n) => s + n, 0);

  function runQuickAction(action: (typeof QUICK_ACTIONS)[number]['action']) {
    if (action === 'newClient') openClient();
    else setRoute(action);
  }

  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Dashboard</div>
          <div className="ps">Today: {dateLabel}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title">Quick Actions</div>
        <div className="qa-grid">
          {QUICK_ACTIONS.map((qa) => (
            <div className="qa-btn" key={qa.label} onClick={() => runQuickAction(qa.action)}>
              <div className="qa-icon">{qa.icon}</div>
              <div className="qa-label">{qa.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid g4" style={{ marginBottom: 14 }}>
        <StatCard
          color="g"
          label="Today's Income"
          value={fc(netIncome)}
          valueStyle={{ fontSize: 22 }}
          sub={`${todaySales.length} sale(s)${returnsTotal > 0 ? ` · −${fc(returnsTotal)} returned` : ''}`}
        />
        <StatCard color="b" label="Visits Today" value={todayVisits.length} sub="check-ins" />
        <StatCard color="c" label="Active Members" value={activeM} sub={`${expiringList.length} expiring soon`} />
        <StatCard color="a" label="Total Clients" value={totalClients} sub="registered" />
      </div>

      <div className="three-col" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-title">Today's Sales Breakdown</div>
          <div className="tbl-wrap">
            {activeItems.length ? (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Revenue</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((i) => (
                    <tr key={i.id}>
                      <td className="td-name">{i.product_name}</td>
                      <td>{i.category}</td>
                      <td>{i.qty}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fc(i.total)}</td>
                      <td>
                        <Button
                          variant="ghost"
                          size="xs"
                          title="Return / void this item"
                          onClick={() => openVoidItem(i.id)}
                        >
                          🗑
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState icon="💳">No sales yet today</EmptyState>
            )}
          </div>
          {adjustments.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
              {adjustments.length} item(s) returned/voided today (−{fc(returnsTotal)}) — see Reports for details.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            Today's Visits <Badge className="bb">{todayVisits.length}</Badge>
          </div>
          {todayVisits.length ? (
            [...todayVisits]
              .reverse()
              .slice(0, 8)
              .map((v) => (
                <div className="vis-row" key={v.id}>
                  <div className="avatar">{initials(v.client_name)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{v.client_name}</div>
                    <div className="ts">{v.visit_time}</div>
                  </div>
                </div>
              ))
          ) : (
            <EmptyState icon="👣">No visits today</EmptyState>
          )}
        </div>

        <div className="card">
          <div className="card-title">⚠ Low Stock</div>
          {lowStock.length ? (
            lowStock.map((p) => (
              <div className="notif-item" key={p.id}>
                <div className="notif-dot" style={{ background: 'var(--amber)' }} />
                <div>
                  <div className="notif-title">{p.name}</div>
                  <div className="notif-sub">
                    {p.stock} left · min {p.min_stock}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon="✅">All stock OK</EmptyState>
          )}
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">
            🔔 Expiring Memberships <Badge className="ba">{expiringList.length}</Badge>
          </div>
          {expiringList.length ? (
            expiringList.slice(0, 8).map((m) => (
              <div className="vis-row" key={m.id}>
                <div className="avatar">{firstLetter(m.client_name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.client_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                    {m.plan_name} · expires {formatDate(m.end_date)}
                  </div>
                </div>
                <StatusBadge status="expiring" />
              </div>
            ))
          ) : (
            <EmptyState icon="✅">None expiring soon</EmptyState>
          )}
        </div>

        <div className="card">
          <div className="card-title">Monthly Income — {year}</div>
          <BarChart bars={monthlyTotals.map((value, i) => ({ label: MONTH_LETTERS[i], value }))} barMax={72} />
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>
            {year} total: {fc(yearTotal)}
          </div>
        </div>
      </div>
    </>
  );
}
