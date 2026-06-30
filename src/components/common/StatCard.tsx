import type { CSSProperties, ReactNode } from 'react';

type StatColor = '' | 'g' | 'b' | 'a' | 'r' | 'p' | 'c';

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  color?: StatColor;
  valueStyle?: CSSProperties;
}

export function StatCard({ label, value, sub, color = '', valueStyle }: StatCardProps) {
  return (
    <div className={`stat ${color}`.trim()}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={valueStyle}>
        {value}
      </div>
      {sub !== undefined && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
