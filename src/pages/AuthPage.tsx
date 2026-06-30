import { useState } from 'react';
import { useAuthStore } from '../features/auth/authStore';
import { useAppStore } from '../store/appStore';
import { confirmDialog } from '../store/confirmStore';

/**
 * Combined setup / login screen.
 * - No account yet → account creation (gym name + password).
 * - Account exists → password login, with an account-reset escape hatch.
 */
export function AuthPage() {
  const hasAccount = useAuthStore((s) => s.hasAccount);
  return hasAccount ? <LoginForm /> : <SetupForm />;
}

function SetupForm() {
  const setup = useAuthStore((s) => s.setup);
  const updateCfg = useAppStore((s) => s.updateCfg);
  const [gym, setGym] = useState('');
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr('');
    if (!gym.trim()) return setErr('Enter gym name');
    if (pass.length < 4) return setErr('Password min 4 characters');
    if (pass !== pass2) return setErr('Passwords do not match');
    setBusy(true);
    try {
      await setup({ gymName: gym.trim(), ownerName: name.trim(), password: pass });
      // Keep the configured gym name in sync so the sidebar shows it immediately.
      updateCfg({ gymName: gym.trim() });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell loginGym={gym.trim() || 'GymPro'}>
      <div className="auth-title">Create Your Account</div>
      <div className="auth-sub">Set up your gym name and a password to get started.</div>
      {err && <div className="auth-err">{err}</div>}
      <div className="fg">
        <label>Gym Name *</label>
        <input value={gym} onChange={(e) => setGym(e.target.value)} placeholder="e.g. PowerGym Sofia" />
      </div>
      <div className="fg">
        <label>Owner / Admin Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
      </div>
      <div className="fg">
        <label>Password *</label>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Min 4 characters" />
      </div>
      <div className="fg">
        <label>Confirm Password *</label>
        <input
          type="password"
          value={pass2}
          onChange={(e) => setPass2(e.target.value)}
          placeholder="Repeat password"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <button className="auth-btn" onClick={submit} disabled={busy}>
        Create Account &amp; Enter
      </button>
    </AuthShell>
  );
}

function LoginForm() {
  const account = useAuthStore((s) => s.account);
  const login = useAuthStore((s) => s.login);
  const resetAccount = useAuthStore((s) => s.resetAccount);
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      const ok = await login(pass);
      if (!ok) {
        setErr('Incorrect password');
        setPass('');
      }
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    const ok = await confirmDialog(
      'Reset will delete your account credentials (NOT your data). Continue?',
    );
    if (ok) resetAccount();
  }

  return (
    <AuthShell loginGym={account?.gymName || 'GymPro'} showGymCard>
      <div className="auth-title">Welcome Back</div>
      <div className="auth-sub">Enter your password to continue.</div>
      {err && <div className="auth-err">{err}</div>}
      <div className="fg">
        <label>Password</label>
        <input
          type="password"
          value={pass}
          autoFocus
          onChange={(e) => setPass(e.target.value)}
          placeholder="Enter password"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </div>
      <button className="auth-btn" onClick={submit} disabled={busy}>
        Enter System
      </button>
      <div className="auth-link" onClick={reset}>
        Forgot password? <span>Reset account</span>
      </div>
    </AuthShell>
  );
}

function AuthShell({
  children,
  loginGym,
  showGymCard,
}: {
  children: React.ReactNode;
  loginGym: string;
  showGymCard?: boolean;
}) {
  return (
    <div className="loading-screen" style={{ display: 'flex' }}>
      <div className="auth-box">
        <div className="auth-logo">
          <div className="auth-logo-mark">🏋️</div>
          <div className="auth-logo-name">
            Gym<span>Pro</span>
          </div>
        </div>
        {showGymCard && (
          <div
            style={{
              background: 'var(--accentbg)',
              border: '1px solid var(--accentborder)',
              borderRadius: 'var(--r)',
              padding: '10px 14px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>🏋️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{loginGym}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>Management System</div>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
