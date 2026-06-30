/**
 * Centralized modal coordinator. Pages call `openX(...)`; the modals (rendered
 * once in AppShell) read their open/target state from here. This mirrors the
 * original global `openClientModal()` etc. without prop-drilling.
 */
import { create } from 'zustand';

interface EditModal {
  open: boolean;
  editId: number | null;
}

interface ModalState {
  client: EditModal;
  clientProfile: { open: boolean; clientId: number | null };
  product: EditModal;
  plan: EditModal;
  staff: EditModal;
  restock: { open: boolean; productId: number | null };
  membership: { open: boolean; membershipId: number | null };

  openClient: (editId?: number | null) => void;
  openClientProfile: (clientId: number) => void;
  openProduct: (editId?: number | null) => void;
  openPlan: (editId?: number | null) => void;
  openStaff: (editId?: number | null) => void;
  openRestock: (productId?: number | null) => void;
  openMembership: (membershipId: number) => void;

  closeClient: () => void;
  closeClientProfile: () => void;
  closeProduct: () => void;
  closePlan: () => void;
  closeStaff: () => void;
  closeRestock: () => void;
  closeMembership: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  client: { open: false, editId: null },
  clientProfile: { open: false, clientId: null },
  product: { open: false, editId: null },
  plan: { open: false, editId: null },
  staff: { open: false, editId: null },
  restock: { open: false, productId: null },
  membership: { open: false, membershipId: null },

  openClient: (editId = null) => set({ client: { open: true, editId } }),
  openClientProfile: (clientId) => set({ clientProfile: { open: true, clientId } }),
  openProduct: (editId = null) => set({ product: { open: true, editId } }),
  openPlan: (editId = null) => set({ plan: { open: true, editId } }),
  openStaff: (editId = null) => set({ staff: { open: true, editId } }),
  openRestock: (productId = null) => set({ restock: { open: true, productId } }),
  openMembership: (membershipId) => set({ membership: { open: true, membershipId } }),

  closeClient: () => set({ client: { open: false, editId: null } }),
  closeClientProfile: () => set({ clientProfile: { open: false, clientId: null } }),
  closeProduct: () => set({ product: { open: false, editId: null } }),
  closePlan: () => set({ plan: { open: false, editId: null } }),
  closeStaff: () => set({ staff: { open: false, editId: null } }),
  closeRestock: () => set({ restock: { open: false, productId: null } }),
  closeMembership: () => set({ membership: { open: false, membershipId: null } }),
}));
