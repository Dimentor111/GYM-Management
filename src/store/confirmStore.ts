/**
 * Promise-based confirmation dialog, replacing native window.confirm with a
 * styled in-app modal. `confirmDialog(message)` resolves to true/false.
 */
import { create } from 'zustand';

interface ConfirmState {
  open: boolean;
  message: string;
  resolver: ((value: boolean) => void) | null;
  request: (message: string) => Promise<boolean>;
  answer: (value: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  message: '',
  resolver: null,
  request: (message) =>
    new Promise<boolean>((resolve) => set({ open: true, message, resolver: resolve })),
  answer: (value) => {
    get().resolver?.(value);
    set({ open: false, resolver: null, message: '' });
  },
}));

/** Imperative helper: `if (await confirmDialog('Sure?')) { ... }`. */
export function confirmDialog(message: string): Promise<boolean> {
  return useConfirmStore.getState().request(message);
}
