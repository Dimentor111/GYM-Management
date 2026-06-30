import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';
import { initDB, subscribe } from './data/db';
import { seedData } from './data/seedData';
import { useAppStore } from './store/appStore';

// Bump the store revision on every DB write so `useQuery` re-runs and the UI
// stays live. Registered before init so the seed writes are captured too.
subscribe(() => useAppStore.getState().bump());

async function bootstrap() {
  try {
    await initDB();
    seedData();
    useAppStore.getState().setReady(true);
  } catch (e) {
    useAppStore.getState().setDbError(e instanceof Error ? e.message : 'Failed to load');
  }
}

void bootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
