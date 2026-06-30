/**
 * POS cart state. Lives in a store (not page-local) so the running cart, chosen
 * client, discount and payment survive navigating away from the POS and back —
 * matching the original behavior where the cart persisted until checkout.
 */
import { create } from 'zustand';
import type { CartItem, DiscountType, PaymentMethod } from '../../types';

interface PosStore {
  cart: CartItem[];
  client: { id: number; name: string } | null;
  discount: number;
  discountType: DiscountType;
  payment: PaymentMethod;
  note: string;
  category: string;

  addItem: (item: Omit<CartItem, 'qty'>) => void;
  changeQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  setClient: (client: { id: number; name: string }) => void;
  clearClient: () => void;
  setDiscount: (n: number) => void;
  setDiscountType: (t: DiscountType) => void;
  setPayment: (p: PaymentMethod) => void;
  setNote: (s: string) => void;
  setCategory: (c: string) => void;
  reset: () => void;
}

export const usePosStore = create<PosStore>((set) => ({
  cart: [],
  client: null,
  discount: 0,
  discountType: 'pct',
  payment: 'cash',
  note: '',
  category: 'all',

  addItem: (item) =>
    set((s) => {
      const existing = s.cart.find((c) => c.id === item.id);
      if (existing) {
        return { cart: s.cart.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c)) };
      }
      return { cart: [...s.cart, { ...item, qty: 1 }] };
    }),
  changeQty: (id, delta) =>
    set((s) => ({
      cart: s.cart
        .map((c) => (c.id === id ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0),
    })),
  removeItem: (id) => set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
  setClient: (client) => set({ client }),
  clearClient: () => set({ client: null }),
  setDiscount: (discount) => set({ discount }),
  setDiscountType: (discountType) => set({ discountType }),
  setPayment: (payment) => set({ payment }),
  setNote: (note) => set({ note }),
  setCategory: (category) => set({ category }),
  reset: () => set({ cart: [], client: null, discount: 0, discountType: 'pct', payment: 'cash', note: '' }),
}));
