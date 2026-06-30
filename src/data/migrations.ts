/**
 * Schema migrations.
 *
 * `CREATE TABLE IF NOT EXISTS` never alters an existing table, so databases
 * created before a column was added — including older `.db` files imported by
 * the user — must be patched with idempotent `ALTER TABLE ... ADD COLUMN`.
 * Each migration checks the live columns first, so running it repeatedly (and
 * on already-current databases) is a no-op.
 */
import type { Database } from 'sql.js';

type ColumnSpec = [name: string, ddl: string];

/** Audit columns added to support void/return of individual sale line items. */
const SALE_ITEM_COLUMNS: ColumnSpec[] = [
  ['status', "status TEXT DEFAULT 'active'"],
  ['deleted_at', 'deleted_at TEXT'],
  ['deleted_by', 'deleted_by TEXT'],
  ['delete_reason', 'delete_reason TEXT'],
  ['returned_to_stock', 'returned_to_stock INTEGER DEFAULT 0'],
];

function existingColumns(db: Database, table: string): Set<string> {
  const res = db.exec(`PRAGMA table_info(${table})`);
  const names = new Set<string>();
  if (res.length) {
    // PRAGMA table_info columns: cid, name, type, notnull, dflt_value, pk → name is index 1.
    for (const row of res[0].values) names.add(String(row[1]));
  }
  return names;
}

function ensureColumns(db: Database, table: string, columns: ColumnSpec[]): void {
  const present = existingColumns(db, table);
  for (const [name, ddl] of columns) {
    if (!present.has(name)) db.run(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

export function runMigrations(db: Database): void {
  ensureColumns(db, 'sale_items', SALE_ITEM_COLUMNS);
}
