import { useAppStore } from '../../store/appStore';
import { useNotifications } from '../../features/dashboard/notifications';
import { EmptyState } from '../common/EmptyState';
import { Button } from '../common/Button';

export function NotificationPanel() {
  const open = useAppStore((s) => s.notifOpen);
  const toggleNotif = useAppStore((s) => s.toggleNotif);
  const notifs = useNotifications();

  return (
    <div className={`notif-panel${open ? ' open' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15 }}>Notifications</div>
        <Button variant="ghost" size="xs" onClick={toggleNotif}>
          Close ✕
        </Button>
      </div>
      {notifs.length ? (
        notifs.map((n, i) => (
          <div className="notif-item" key={i}>
            <div className="notif-dot" style={{ background: n.color }} />
            <div>
              <div className="notif-title">{n.title}</div>
              <div className="notif-sub">{n.sub}</div>
            </div>
          </div>
        ))
      ) : (
        <EmptyState icon="🔔">No notifications</EmptyState>
      )}
    </div>
  );
}
