/**
 * Authentication state.
 *
 * - The account (gym name, owner name, password hash) is persisted to
 *   localStorage. The login session is a flag in sessionStorage, so closing
 *   the tab requires logging in again.
 * - First run (no account) → setup. Otherwise → login. Lock clears the session.
 */
import { create } from 'zustand';
import type { Account } from '../../types';
import { hashPassword } from './authUtils';

const AK = 'gympro_acct';
const SK = 'gympro_sess';

function loadAccount(): Account | null {
  try {
    return JSON.parse(localStorage.getItem(AK) || 'null');
  } catch {
    return null;
  }
}

function persistAccount(account: Account): void {
  localStorage.setItem(AK, JSON.stringify(account));
}

export interface SetupInput {
  gymName: string;
  ownerName: string;
  password: string;
}

interface AuthStore {
  account: Account | null;
  hasAccount: boolean;
  isAuthenticated: boolean;
  ownerName: string;

  setup: (input: SetupInput) => Promise<void>;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  resetAccount: () => void;
  changePassword: (current: string, next: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>((set, get) => {
  const initial = loadAccount();
  return {
    account: initial,
    hasAccount: !!initial,
    isAuthenticated: sessionStorage.getItem(SK) === '1' && !!initial,
    ownerName: initial?.ownerName || 'Owner',

    setup: async ({ gymName, ownerName, password }) => {
      const account: Account = {
        gymName,
        ownerName: ownerName || 'Owner',
        passHash: await hashPassword(password),
      };
      persistAccount(account);
      sessionStorage.setItem(SK, '1');
      set({ account, hasAccount: true, isAuthenticated: true, ownerName: account.ownerName });
    },

    login: async (password) => {
      const acct = get().account;
      if (!acct) return false;
      const hash = await hashPassword(password);
      if (hash !== acct.passHash) return false;
      sessionStorage.setItem(SK, '1');
      set({ isAuthenticated: true });
      return true;
    },

    logout: () => {
      sessionStorage.removeItem(SK);
      set({ isAuthenticated: false });
    },

    resetAccount: () => {
      // Removes credentials only — the gym data (DB) is untouched.
      localStorage.removeItem(AK);
      sessionStorage.removeItem(SK);
      set({ account: null, hasAccount: false, isAuthenticated: false });
    },

    changePassword: async (current, next) => {
      const acct = get().account;
      if (!acct) return false;
      if ((await hashPassword(current)) !== acct.passHash) return false;
      const updated: Account = { ...acct, passHash: await hashPassword(next) };
      persistAccount(updated);
      set({ account: updated });
      return true;
    },
  };
});
