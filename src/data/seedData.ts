/**
 * First-run seed data. Inserts a starter set of membership plans and products
 * only when no plans exist yet — identical to the original build so a fresh
 * install looks the same. Gyms can edit/delete all of it from the UI.
 */
import { batch, mutate, scalar } from './db';
import { nowISO } from '../utils/dates';

type SeedPlan = [name: string, desc: string, price: number, days: number, vis: number, maxd: number, color: string, frz: number, ren: number];
type SeedProduct = [name: string, cat: string, price: number, cost: number, stock: number, min: number, desc: string, act: number, pos: number, track: number];

const PLANS: SeedPlan[] = [
  ['Monthly Unlimited', 'Full access, unlimited visits', 38, 30, 0, 1, 'green', 1, 1],
  ['Monthly – Student', 'Student discount', 32, 30, 0, 1, 'blue', 1, 1],
  ['Two Weeks', '2-week access card', 25, 14, 0, 1, 'cyan', 0, 1],
  ['3 Months', 'Quarter year', 110, 92, 0, 1, 'purple', 1, 1],
  ['Weekly Card', '7-day access', 15, 7, 0, 1, 'amber', 0, 1],
  ['8-Visit Card', 'Visit bundle', 35, 180, 8, 1, 'red', 0, 1],
];

const PRODUCTS: SeedProduct[] = [
  ['Water Bottle', 'supplement', 1.0, 0.3, 100, 20, '', 1, 1, 1],
  ['Protein', 'supplement', 2.0, 1.0, 50, 10, '', 1, 1, 1],
  ['Pre-Workout', 'supplement', 1.5, 0.7, 40, 8, '', 1, 1, 1],
  ['Amino', 'supplement', 1.5, 0.7, 35, 8, '', 1, 1, 1],
  ['Protein Bar', 'supplement', 2.5, 1.2, 30, 5, '', 1, 1, 1],
  ['Towel Rental', 'other', 2.0, 0, 0, 0, '', 1, 1, 0],
  ['Day Pass', 'other', 5.0, 0, 0, 0, 'Single day entry', 1, 1, 0],
];

export function seedData(): void {
  if ((scalar<number>('SELECT COUNT(*) FROM membership_plans') ?? 0) > 0) return;
  const now = nowISO();
  batch(() => {
    PLANS.forEach(([name, desc, price, days, vis, maxd, col, frz, ren]) =>
      mutate(
        `INSERT INTO membership_plans(name,description,price,duration_days,total_visits,max_visits_day,color,can_freeze,can_renew,active,show_pos,created_at) VALUES(?,?,?,?,?,?,?,?,?,1,1,?)`,
        [name, desc, price, days, vis, maxd, col, frz, ren, now],
      ),
    );
    PRODUCTS.forEach(([name, cat, price, cost, stock, min, desc, act, pos, track]) =>
      mutate(
        `INSERT INTO products(name,category,sale_price,cost_price,stock,min_stock,description,active,show_pos,track_stock,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
        [name, cat, price, cost, stock, min, desc, act, pos, track, now],
      ),
    );
  });
}
