/**
 * Global UI/config store.
 *
 * - `revision` is bumped on every DB write (wired in main.tsx) so `useQuery`
 *   re-runs and the UI updates live.
 * - `cfg` holds gym settings (persisted to localStorage, separate from the DB).
 * - `route` drives in-app navigation (kiosk-style, no URL routing — mirrors the
 *   original single-page behavior).
 */
import { create } from 'zustand';
import type { GymSettings } from '../types';

const SETK = 'gympro_set';

export type Route =
  | 'dashboard'
  | 'checkin'
  | 'pos'
  | 'clients'
  | 'memberships'
  | 'inventory'
  | 'reports'
  | 'products'
  | 'plans'
  | 'staff'
  | 'settings';

export const PAGE_TITLES: Record<Route, string> = {
  dashboard: 'Dashboard',
  checkin: 'Check-In',
  pos: 'Sale / POS',
  clients: 'Clients',
  memberships: 'Memberships',
  inventory: 'Inventory',
  reports: 'Reports',
  products: 'Products & Services',
  plans: 'Membership Plans',
  staff: 'Staff',
  settings: 'Settings',
};

const DEFAULT_CFG: GymSettings = {
  gymName: 'GymPro',
  currency: '€',
  address: '',
  phone: '',
  email: '',
  categories: ['Membership', 'Single Visit', 'Supplement', 'Other', 'Service'],
};

function loadCfg(): GymSettings {
  try {
    const s = localStorage.getItem(SETK);
    if (s) return { ...DEFAULT_CFG, ...JSON.parse(s) };
  } catch {
    /* ignore corrupt config */
  }
  return { ...DEFAULT_CFG };
}

function persistCfg(cfg: GymSettings): void {
  localStorage.setItem(SETK, JSON.stringify(cfg));
}

interface AppState {
  dbReady: boolean;
  dbError: string | null;
  revision: number;
  route: Route;
  cfg: GymSettings;
  notifOpen: boolean;
  /** Seed value passed to the Clients page from the global search box. */
  clientSearchSeed: string;

  setReady: (v: boolean) => void;
  setDbError: (msg: string) => void;
  bump: () => void;
  setRoute: (r: Route) => void;
  updateCfg: (patch: Partial<GymSettings>) => void;
  addCategory: (name: string) => void;
  removeCategory: (index: number) => void;
  setNotifOpen: (open: boolean) => void;
  toggleNotif: () => void;
  setClientSearchSeed: (v: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  dbReady: false,
  dbError: null,
  revision: 0,
  route: 'dashboard',
  cfg: loadCfg(),
  notifOpen: false,
  clientSearchSeed: '',

  setReady: (v) => set({ dbReady: v }),
  setDbError: (msg) => set({ dbError: msg }),
  bump: () => set((s) => ({ revision: s.revision + 1 })),
  setRoute: (r) => set({ route: r, notifOpen: false }),
  updateCfg: (patch) => {
    const cfg = { ...get().cfg, ...patch };
    persistCfg(cfg);
    set({ cfg });
  },
  addCategory: (name) => {
    const trimmed = name.trim();
    const cfg = get().cfg;
    if (!trimmed || cfg.categories.includes(trimmed)) return;
    const next = { ...cfg, categories: [...cfg.categories, trimmed] };
    persistCfg(next);
    set({ cfg: next });
  },
  removeCategory: (index) => {
    const cfg = get().cfg;
    const next = { ...cfg, categories: cfg.categories.filter((_, i) => i !== index) };
    persistCfg(next);
    set({ cfg: next });
  },
  setNotifOpen: (open) => set({ notifOpen: open }),
  toggleNotif: () => set((s) => ({ notifOpen: !s.notifOpen })),
  setClientSearchSeed: (v) => set({ clientSearchSeed: v }),
}));
