import type { ReactNode } from 'react';

interface BadgeDef {
  cls: string;
  dot?: string;
  label: string;
}

/** Status → badge styling. Covers both membership and client statuses. */
const STATUS_BADGES: Record<string, BadgeDef> = {
  active: { cls: 'bg', dot: 'dg', label: 'Active' },
  expiring: { cls: 'ba', dot: 'da', label: 'Expiring' },
  expired: { cls: 'br', dot: 'dr', label: 'Expired' },
  frozen: { cls: 'bb', dot: 'db', label: 'Frozen' },
  canceled: { cls: 'bn', label: 'Canceled' },
  inactive: { cls: 'bn', label: 'Inactive' },
};

export function StatusBadge({ status }: { status: string }) {
  const b = STATUS_BADGES[status];
  if (!b) return <span className="badge bn">{status}</span>;
  return (
    <span className={`badge ${b.cls}`}>
      {b.dot && <span className={`dot ${b.dot}`} />}
      {b.label}
    </span>
  );
}

/** Generic badge with an explicit color class (bg/br/ba/bb/bp/bc/bn). */
export function Badge({ className = 'bn', children }: { className?: string; children: ReactNode }) {
  return <span className={`badge ${className}`}>{children}</span>;
}
