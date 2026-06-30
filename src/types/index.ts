/**
 * Central data model.
 *
 * Row interfaces use snake_case fields so they map 1:1 onto the SQLite columns
 * returned by the query layer — no remapping needed between the DB and the UI.
 * `0 | 1` integer fields mirror SQLite's boolean storage.
 */

export type ID = number;

/** SQLite stores booleans as integers. */
export type Bool = 0 | 1;

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other' | 'unpaid' | 'free';

export type DiscountType = 'pct' | 'fixed';

export type PlanColor = 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'cyan';

export type StaffRole = 'owner' | 'manager' | 'reception' | 'trainer';

/** Derived membership state (computed, never stored as-is besides frozen/canceled). */
export type MembershipStatus = 'active' | 'expiring' | 'expired' | 'frozen' | 'canceled';

/** Derived client state. */
export type ClientStatus = 'active' | 'expiring' | 'expired' | 'inactive';

/** Product categories are free-form strings configured per gym. */
export type ProductCategory = string;

// ─── Settings & auth ──────────────────────────────────────────────

export interface GymSettings {
  gymName: string;
  currency: string;
  address: string;
  phone: string;
  email: string;
  categories: ProductCategory[];
}

/** The owner/admin credential record persisted in localStorage. */
export interface Account {
  gymName: string;
  ownerName: string;
  passHash: string;
}

export interface AuthState {
  account: Account | null;
  isAuthenticated: boolean;
}

// ─── Domain records (SQLite rows) ─────────────────────────────────

export interface Client {
  id: ID;
  fname: string;
  lname: string;
  phone: string | null;
  email: string | null;
  dob: string | null;
  notes: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface MembershipPlan {
  id: ID;
  name: string;
  price: number;
  duration_days: number;
  total_visits: number;
  max_visits_day: number;
  description: string | null;
  color: PlanColor;
  can_freeze: Bool;
  can_renew: Bool;
  active: Bool;
  show_pos: Bool;
  created_at: string | null;
}

export interface Membership {
  id: ID;
  client_id: ID | null;
  plan_id: ID | null;
  plan_name: string;
  client_name: string;
  price: number;
  start_date: string;
  end_date: string;
  total_visits: number;
  visits_used: number;
  status: string;
  payment_method: string;
  staff_name: string | null;
  sale_id: ID | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Product {
  id: ID;
  name: string;
  category: ProductCategory;
  sale_price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  description: string | null;
  active: Bool;
  show_pos: Bool;
  track_stock: Bool;
  created_at: string | null;
}

export interface Sale {
  id: ID;
  client_id: ID | null;
  client_name: string | null;
  total: number;
  discount: number;
  discount_type: DiscountType;
  final_total: number;
  payment_method: PaymentMethod;
  staff_name: string | null;
  status: string;
  notes: string | null;
  sale_date: string;
  sale_time: string;
  created_at: string | null;
}

export interface SaleItem {
  id: ID;
  sale_id: ID;
  product_id: ID | null;
  product_name: string;
  category: ProductCategory;
  qty: number;
  unit_price: number;
  total: number;
  item_type: 'plan' | 'product';
  ref_id: ID;
}

export interface Visit {
  id: ID;
  client_id: ID | null;
  client_name: string;
  membership_id: ID | null;
  visit_type: string;
  visit_date: string;
  visit_time: string;
  created_at: string | null;
}

export interface StockMovement {
  id: ID;
  product_id: ID;
  product_name: string;
  type: 'sale' | 'restock';
  qty: number;
  notes: string | null;
  created_at: string | null;
}

export interface StaffMember {
  id: ID;
  name: string;
  role: StaffRole;
  phone: string | null;
  email: string | null;
  active: Bool;
  created_at: string | null;
}

// ─── POS / cart ───────────────────────────────────────────────────

export interface CartItem {
  /** Stable cart key: 'p'+planId for plans, 'r'+productId for products. */
  id: string;
  name: string;
  price: number;
  cat: ProductCategory;
  type: 'plan' | 'product';
  /** Underlying plan id or product id. */
  rid: ID;
  qty: number;
  /** Present for products that track stock. */
  track_stock?: boolean;
  stock?: number;
}

// ─── Reports ──────────────────────────────────────────────────────

export type ReportType = 'daily' | 'monthly' | 'yearly';

export interface ReportFilters {
  type: ReportType;
  /** YYYY-MM-DD for daily reports. */
  date: string;
  /** Two-digit month (01-12) for monthly reports. */
  month: string;
  /** Four-digit year for monthly/yearly reports. */
  year: string;
}
