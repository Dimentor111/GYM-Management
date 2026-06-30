import { useEffect, type ComponentType } from 'react';
import { useAppStore, type Route } from '../../store/appStore';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationPanel } from './NotificationPanel';
import { DashboardPage } from '../../pages/DashboardPage';
import { CheckInPage } from '../../pages/CheckInPage';
import { POSPage } from '../../pages/POSPage';
import { ClientsPage } from '../../pages/ClientsPage';
import { MembershipsPage } from '../../pages/MembershipsPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { ReportsPage } from '../../pages/ReportsPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { PlansPage } from '../../pages/PlansPage';
import { StaffPage } from '../../pages/StaffPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { ClientModal } from '../../pages/modals/ClientModal';
import { ClientProfileModal } from '../../pages/modals/ClientProfileModal';
import { ProductModal } from '../../pages/modals/ProductModal';
import { PlanModal } from '../../pages/modals/PlanModal';
import { StaffModal } from '../../pages/modals/StaffModal';
import { RestockModal } from '../../pages/modals/RestockModal';
import { MembershipModal } from '../../pages/modals/MembershipModal';

const PAGES: Record<Route, ComponentType> = {
  dashboard: DashboardPage,
  checkin: CheckInPage,
  pos: POSPage,
  clients: ClientsPage,
  memberships: MembershipsPage,
  inventory: InventoryPage,
  reports: ReportsPage,
  products: ProductsPage,
  plans: PlansPage,
  staff: StaffPage,
  settings: SettingsPage,
};

export function AppShell() {
  const route = useAppStore((s) => s.route);
  const gymName = useAppStore((s) => s.cfg.gymName);
  const Page = PAGES[route];
  const noPad = route === 'pos';

  useEffect(() => {
    document.title = `${gymName} — GymPro`;
  }, [gymName]);

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header />
        <div className="pages">
          {/* keyed by route so the fade-in animation replays on navigation */}
          <div className={`page${noPad ? ' nopad' : ''}`} key={route}>
            <Page />
          </div>
        </div>
      </div>

      <NotificationPanel />

      <ClientModal />
      <ClientProfileModal />
      <ProductModal />
      <PlanModal />
      <StaffModal />
      <RestockModal />
      <MembershipModal />
    </div>
  );
}
