/**
 * Reactive query hooks.
 *
 * `useQuery`/`useScalar` re-run their SQL whenever the DB revision changes,
 * giving components live data without manual refresh calls. Because every
 * mutation bumps the revision, dashboards/lists update the moment a sale,
 * check-in, membership change or restock happens.
 */
import { useMemo } from 'react';
import { query, scalar, type Params, type Row } from '../data/db';
import { useAppStore } from './appStore';
import { formatMoney } from '../utils/money';

export function useQuery<T = Row>(sql: string, params: Params = []): T[] {
  const revision = useAppStore((s) => s.revision);
  const ready = useAppStore((s) => s.dbReady);
  const key = JSON.stringify(params);
  // params is intentionally read fresh each run; `key` captures its value for memoization.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (ready ? query<T>(sql, params) : []), [sql, key, revision, ready]);
}

export function useScalar<T = number>(sql: string, params: Params = []): T | null {
  const revision = useAppStore((s) => s.revision);
  const ready = useAppStore((s) => s.dbReady);
  const key = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (ready ? scalar<T>(sql, params) : null), [sql, key, revision, ready]);
}

/** Returns a memoized money formatter bound to the configured currency. */
export function useFormatMoney(): (n: number) => string {
  const currency = useAppStore((s) => s.cfg.currency);
  return useMemo(() => (n: number) => formatMoney(n, currency), [currency]);
}
