import { useRef, useState } from 'react';
import { PAGE_TITLES, useAppStore } from '../../store/appStore';
import { useNotifications } from '../../features/dashboard/notifications';
import { query } from '../../data/db';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import type { Client } from '../../types';

export function Header() {
  const route = useAppStore((s) => s.route);
  const setRoute = useAppStore((s) => s.setRoute);
  const toggleNotif = useAppStore((s) => s.toggleNotif);
  const setClientSearchSeed = useAppStore((s) => s.setClientSearchSeed);
  const notifs = useNotifications();

  const [term, setTerm] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function onSearch(value: string) {
    setTerm(value);
    clearTimeout(timer.current);
    if (!value || value.length < 2) return;
    // Debounced: if the term matches any client, jump to the Clients page seeded with it.
    timer.current = setTimeout(() => {
      const matches = query<Client>(
        `SELECT * FROM clients WHERE lower(fname||' '||lname) LIKE ? OR phone LIKE ? LIMIT 3`,
        ['%' + value.toLowerCase() + '%', '%' + value + '%'],
      );
      if (matches.length) {
        setClientSearchSeed(value);
        setRoute('clients');
        setTerm('');
      }
    }, 300);
  }

  return (
    <div className="topbar">
      <div className="topbar-title">{PAGE_TITLES[route]}</div>
      <div className="topbar-search">
        <Icon name="search" className="search-icon" />
        <input
          placeholder="Search clients, products…"
          value={term}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div className="topbar-actions">
        <div className="icon-btn" onClick={toggleNotif} title="Notifications">
          <Icon name="bell" size={15} />
          {notifs.length > 0 && <span className="notif-dot-badge">{notifs.length}</span>}
        </div>
        <Button variant="primary" size="sm" onClick={() => setRoute('pos')}>
          + New Sale
        </Button>
      </div>
    </div>
  );
}
