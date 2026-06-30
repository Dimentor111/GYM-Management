import { useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../features/auth/authStore';
import { confirmDialog } from '../store/confirmStore';
import { toast } from '../store/toastStore';
import { downloadDatabase, readDatabaseFile } from '../data/importExport';
import { exportSalesCSV } from '../features/reports/csvExport';
import { getDBSizeKB } from '../data/db';
import { Button } from '../components/common/Button';
import { Field } from '../components/common/Field';

export function SettingsPage() {
  const cfg = useAppStore((s) => s.cfg);
  const updateCfg = useAppStore((s) => s.updateCfg);
  const addCategory = useAppStore((s) => s.addCategory);
  const removeCategory = useAppStore((s) => s.removeCategory);
  const revision = useAppStore((s) => s.revision);
  const changePassword = useAuthStore((s) => s.changePassword);

  const [biz, setBiz] = useState({
    gymName: cfg.gymName,
    address: cfg.address,
    phone: cfg.phone,
    email: cfg.email,
    currency: cfg.currency,
  });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [newCat, setNewCat] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  void revision; // DB size is read live below.
  const dbSize = getDBSizeKB().toFixed(1);

  function saveBusiness() {
    updateCfg({
      gymName: biz.gymName.trim() || 'GymPro',
      address: biz.address.trim(),
      phone: biz.phone.trim(),
      email: biz.email.trim(),
      currency: biz.currency.trim() || '€',
    });
    document.title = `${biz.gymName.trim() || 'GymPro'} — GymPro`;
    toast('Settings saved ✓');
  }

  async function submitPassword() {
    if (pw.next.length < 4) return toast('Min 4 characters', 'var(--red)');
    if (pw.next !== pw.confirm) return toast('Passwords do not match', 'var(--red)');
    const ok = await changePassword(pw.current, pw.next);
    if (!ok) return toast('Current password incorrect', 'var(--red)');
    setPw({ current: '', next: '', confirm: '' });
    toast('Password changed ✓');
  }

  function addCat() {
    if (!newCat.trim()) return;
    addCategory(newCat);
    setNewCat('');
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
    <>
      <div className="ph">
        <div>
          <div className="pt">Settings</div>
          <div className="ps">Business configuration</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-title">Business Information</div>
            <Field label="Gym Name">
              <input value={biz.gymName} placeholder="Gym name" onChange={(e) => setBiz({ ...biz, gymName: e.target.value })} />
            </Field>
            <Field label="Address">
              <input value={biz.address} placeholder="Address" onChange={(e) => setBiz({ ...biz, address: e.target.value })} />
            </Field>
            <div className="frow c2">
              <Field label="Phone">
                <input value={biz.phone} placeholder="Phone" onChange={(e) => setBiz({ ...biz, phone: e.target.value })} />
              </Field>
              <Field label="Email">
                <input value={biz.email} placeholder="Email" onChange={(e) => setBiz({ ...biz, email: e.target.value })} />
              </Field>
            </div>
            <Field label="Currency Symbol">
              <input value={biz.currency} placeholder="€" style={{ width: 80 }} onChange={(e) => setBiz({ ...biz, currency: e.target.value })} />
            </Field>
            <Button variant="primary" onClick={saveBusiness}>
              Save Settings
            </Button>
          </div>

          <div className="card">
            <div className="card-title">Change Password</div>
            <Field label="Current Password">
              <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </Field>
            <Field label="New Password">
              <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </Field>
            <Field label="Confirm New">
              <input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </Field>
            <Button variant="primary" onClick={submitPassword}>
              Change Password
            </Button>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-title">Product Categories</div>
            <div style={{ marginBottom: 10 }}>
              {cfg.categories.map((c, i) => (
                <div className="cats-row" key={`${c}-${i}`}>
                  <span>{c}</span>
                  <span className="inline-x" onClick={() => removeCategory(i)}>
                    ✕
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <input
                value={newCat}
                placeholder="New category name…"
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCat()}
              />
              <Button variant="primary" size="sm" onClick={addCat}>
                Add
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Data Management</div>
            <div className="data-col">
              <Button
                variant="ghost"
                onClick={() => {
                  downloadDatabase();
                  toast('Database exported ✓');
                }}
              >
                📥 Export Database (.db file)
              </Button>
              <Button variant="ghost" onClick={() => fileRef.current?.click()}>
                📤 Import Database (.db file)
              </Button>
              <Button variant="ghost" onClick={exportSalesCSV}>
                📊 Export All Sales to CSV
              </Button>
              <input ref={fileRef} type="file" accept=".db" style={{ display: 'none' }} onChange={handleImport} />
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>DB size: ~{dbSize} KB</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
