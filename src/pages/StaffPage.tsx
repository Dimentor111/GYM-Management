import { useModalStore } from '../store/modalStore';
import { useQuery } from '../store/useQuery';
import { mutate } from '../data/db';
import { confirmDialog } from '../store/confirmStore';
import { formatDate } from '../utils/dates';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import type { StaffMember, StaffRole } from '../types';

const ROLE_BADGE: Record<StaffRole, string> = {
  owner: 'bp',
  manager: 'bb',
  reception: 'bg',
  trainer: 'ba',
};

export function StaffPage() {
  const openStaff = useModalStore((s) => s.openStaff);
  const rows = useQuery<StaffMember>(`SELECT * FROM staff ORDER BY name`);

  async function remove(id: number) {
    if (await confirmDialog('Remove this staff member?')) {
      mutate('UPDATE staff SET active=0 WHERE id=?', [id]);
    }
  }

  return (
    <>
      <div className="ph">
        <div>
          <div className="pt">Staff</div>
          <div className="ps">Team members and access roles</div>
        </div>
        <div className="ph-right">
          <Button variant="primary" onClick={() => openStaff()}>
            + Add Staff
          </Button>
        </div>
      </div>

      <div className="card-flush">
        {rows.length ? (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Added</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="td-name">{s.name}</td>
                    <td>
                      <Badge className={ROLE_BADGE[s.role] || 'bn'}>{s.role}</Badge>
                    </td>
                    <td>{s.phone || '—'}</td>
                    <td>{s.email || '—'}</td>
                    <td className="ts">{formatDate(s.created_at?.slice(0, 10))}</td>
                    <td>{s.active ? <Badge className="bg">Active</Badge> : <Badge className="bn">Inactive</Badge>}</td>
                    <td>
                      <div className="td-actions">
                        <Button variant="ghost" size="xs" onClick={() => openStaff(s.id)}>
                          Edit
                        </Button>
                        <Button variant="danger" size="xs" onClick={() => remove(s.id)}>
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon">👤</div>
            No staff added
          </div>
        )}
      </div>
    </>
  );
}
