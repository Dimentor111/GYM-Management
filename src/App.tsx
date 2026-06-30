import { useAppStore } from './store/appStore';
import { useAuthStore } from './features/auth/authStore';
import { AppShell } from './components/layout/AppShell';
import { AuthPage } from './pages/AuthPage';
import { Toast } from './components/common/Toast';
import { ConfirmDialog } from './components/common/ConfirmDialog';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <div style={{ color: 'var(--text2)', fontSize: 13 }}>Loading GymPro...</div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="loading-screen">
      <div style={{ color: 'var(--red)', textAlign: 'center', padding: 30 }}>
        <div style={{ fontSize: 24, marginBottom: 10 }}>⚠️</div>
        Failed to load.
        <br />
        <small style={{ color: 'var(--text3)' }}>{message}</small>
      </div>
    </div>
  );
}

export function App() {
  const dbReady = useAppStore((s) => s.dbReady);
  const dbError = useAppStore((s) => s.dbError);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  let content;
  if (dbError) content = <ErrorScreen message={dbError} />;
  else if (!dbReady) content = <LoadingScreen />;
  else if (isAuthenticated) content = <AppShell />;
  else content = <AuthPage />;

  return (
    <>
      {content}
      <Toast />
      <ConfirmDialog />
    </>
  );
}
