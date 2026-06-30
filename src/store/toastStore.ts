/** Transient toast notifications. `toast()` is callable from anywhere. */
import { create } from 'zustand';

interface ToastState {
  message: string | null;
  color: string;
  show: (message: string, color?: string) => void;
  hide: () => void;
}

let timer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  color: 'var(--green)',
  show: (message, color = 'var(--green)') => {
    set({ message, color });
    clearTimeout(timer);
    timer = setTimeout(() => set({ message: null }), 2800);
  },
  hide: () => {
    clearTimeout(timer);
    set({ message: null });
  },
}));

/** Imperative toast helper for use outside React components (logic modules). */
export function toast(message: string, color?: string): void {
  useToastStore.getState().show(message, color);
}
