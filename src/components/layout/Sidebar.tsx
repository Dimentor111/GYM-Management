import { useEffect, useRef, useState } from 'react';
import { PAGE_TITLES, useAppStore, type Route } from '../../store/appStore';
import { useAuthStore } from '../../features/auth/authStore';
import { confirmDialog } from '../../store/confirmStore';
import { toast } from '../../store/toastStore';
import { downloadDatabase, readDatabaseFile } from '../../data/importExport';
import { getLastSaved } from '../../data/db';
import { nowTime } from '../../utils/dates';
import { firstLetter } from '../../utils/validation';
import { Icon, type IconName } from '../common/Icon';

interface NavLink {
  route: Route;
  icon: IconName;
}

const NAV_GROUPS: { group: string; items: NavLink[] }[] = [
  { group: 'Overview', items: [{ route: 'dashboard', icon: 'dashboard' }, { route: 'checkin', icon: 'checkin' }] },
  {
    group: 'Business',
    items: [
      { route: 'pos', icon: 'pos' },
      { route: 'clients', icon: 'clients' },
      { route: 'memberships', icon: 'memberships' },
      { route: 'inventory', icon: 'inventory' },
    ],
  },
  { group: 'Analytics', items: [{ route: 'reports', icon: 'reports' }] },
  {
    group: 'Configuration',
    items: [
      { route: 'products', icon: 'products' },
      { route: 'plans', icon: 'plans' },
      { route: 'staff', icon: 'staff' },
      { route: 'settings', icon: 'settings' },
    ],
  },
];

export function Sidebar() {
  const route = useAppStore((s) => s.route);
  const setRoute = useAppStore((s) => s.setRoute);
  const revision = useAppStore((s) => s.revision);
  const gymName = useAppStore((s) => s.cfg.gymName);
  const ownerName = useAuthStore((s) => s.ownerName);
  const logout = useAuthStore((s) => s.logout);
  const fileRef = useRef<HTMLInputElement>(null);

  const [clock, setClock] = useState(nowTime());
  useEffect(() => {
    const id = setInterval(() => setClock(nowTime()), 10_000);
    return () => clearInterval(id);
  }, []);

  // getLastSaved() changes after every write; re-read it on revision change.
  void revision;
  const saved = getLastSaved();

  async function handleLogout() {
    if (await confirmDialog('Lock the system?')) logout();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!(await confirmDialog('Replace ALL current data with the imported database?'))) return;
    try {
      await readDatabaseFile(file);
      toast('Database imported ✓');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed', 'var(--red)');
    }
  }

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-mark">🏋️</div>
        <div className="sb-logo-text">
          Gym<span>Pro</span>
        </div>
      </div>
      <div className="sb-gym">
        <div className="sb-gym-name">{gymName}</div>
        <div className="sb-gym-role">Owner · Admin</div>
      </div>

      <nav>
        {NAV_GROUPS.map((g) => (
          <div key={g.group}>
            <div className="nav-group">{g.group}</div>
            {g.items.map((item) => (
              <div
                key={item.route}
                className={`nav-item${route === item.route ? ' active' : ''}`}
                onClick={() => setRoute(item.route)}
              >
                <Icon name={item.icon} className="nav-icon" strokeWidth={1.8} />
                {PAGE_TITLES[item.route]}
              </div>
            ))}
          </div>
        ))}

        <div className="nav-group">Data</div>
        <div
          className="nav-item"
          onClick={() => {
            downloadDatabase();
            toast('Database exported ✓');
          }}
        >
          <Icon name="export" className="nav-icon" strokeWidth={1.8} />
          Export DB
        </div>
        <div className="nav-item" onClick={() => fileRef.current?.click()}>
          <Icon name="import" className="nav-icon" strokeWidth={1.8} />
          Import DB
        </div>
        <input ref={fileRef} type="file" accept=".db" style={{ display: 'none' }} onChange={handleImport} />
      </nav>

      <div className="sb-footer">
        <div className="sb-user" onClick={handleLogout}>
          <div className="sb-avatar">{firstLetter(ownerName)}</div>
          <div className="sb-user-info">
            <div className="sb-user-name">{ownerName}</div>
            <div className="sb-user-sub">Click to lock</div>
          </div>
          <Icon name="logout" size={13} className="" />
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--text3)',
            padding: '3px 8px',
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <span>{saved ? `Saved ${saved}` : 'Ready'}</span>
          <span>{clock}</span>
        </div>
      </div>
    </aside>
  );
}
