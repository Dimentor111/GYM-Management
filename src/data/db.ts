/**
 * SQLite (sql.js / WASM) persistence engine.
 *
 * This is the single source of truth for all domain data. The database lives in
 * memory and is serialized to localStorage (base64) after every write, exactly
 * like the original build — which keeps exported `.db` files compatible.
 *
 * Reactivity: every mutation notifies subscribers. The app store subscribes and
 * bumps a revision counter so the `useQuery` hook re-runs and the UI updates
 * live whenever sales, check-ins, memberships, inventory, etc. change.
 */
import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { SCHEMA } from './schema';

const DBK = 'gympro_db';

export type Row = Record<string, SqlValue>;
export type Params = SqlValue[];

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const listeners = new Set<() => void>();
let lastSavedAt = '';

// Batching: suppress intermediate persist()/notify() during multi-write
// operations (e.g. POS checkout) so the DB is serialized once at the end.
let deferDepth = 0;
let dirty = false;

/** Subscribe to write notifications. Returns an unsubscribe function. */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  listeners.forEach((fn) => fn());
}

function requireDB(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

/** Initialize sql.js and load (or create) the database. Call once at startup. */
export async function initDB(): Promise<void> {
  SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
  const stored = localStorage.getItem(DBK);
  if (stored) {
    try {
      const bin = atob(stored);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      db = new SQL.Database(arr);
    } catch {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }
  db.run(SCHEMA);
  persist();
}

/** Serialize the database to localStorage. */
export function persist(): void {
  const data = requireDB().export();
  let b = '';
  const chunk = 8192;
  for (let i = 0; i < data.length; i += chunk) {
    b += btoa(String.fromCharCode(...data.subarray(i, i + chunk)));
  }
  try {
    localStorage.setItem(DBK, b);
    lastSavedAt = new Date().toTimeString().slice(0, 5);
  } catch (e) {
    // Storage quota or private-mode errors shouldn't crash the app.
    console.warn('persist failed', e);
  }
}

export function getLastSaved(): string {
  return lastSavedAt;
}

export function getDBSizeKB(): number {
  return (localStorage.getItem(DBK) || '').length / 1024;
}

/** Run a SELECT and return typed rows. */
export function query<T = Row>(sql: string, params: Params = []): T[] {
  const res = requireDB().exec(sql, params);
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])) as T);
}

/** Run a SELECT and return the first column of the first row (or null). */
export function scalar<T = SqlValue>(sql: string, params: Params = []): T | null {
  const res = requireDB().exec(sql, params);
  return res.length && res[0].values.length ? (res[0].values[0][0] as T) : null;
}

/** Run an INSERT/UPDATE/DELETE. Persists and notifies (unless inside a batch). */
export function mutate(sql: string, params: Params = []): void {
  requireDB().run(sql, params);
  if (deferDepth > 0) {
    dirty = true;
  } else {
    persist();
    notify();
  }
}

/** Group multiple mutations into a single persist + notify. */
export function batch(fn: () => void): void {
  deferDepth++;
  try {
    fn();
  } finally {
    deferDepth--;
    if (deferDepth === 0 && dirty) {
      dirty = false;
      persist();
      notify();
    }
  }
}

export function lastInsertId(): number {
  return Number(scalar('SELECT last_insert_rowid()')) || 0;
}

/** Raw bytes for `.db` export. */
export function exportDatabase(): Uint8Array {
  return requireDB().export();
}

/** Replace the entire database from imported `.db` bytes. */
export function importDatabase(bytes: Uint8Array): void {
  if (!SQL) throw new Error('SQL engine not ready');
  db = new SQL.Database(bytes);
  db.run(SCHEMA);
  persist();
  notify();
}
