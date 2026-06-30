import type { CSSProperties, ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  children: ReactNode;
  style?: CSSProperties;
}

export function EmptyState({ icon, children, style }: EmptyStateProps) {
  return (
    <div className="empty" style={style}>
      <div className="empty-icon">{icon}</div>
      {children}
    </div>
  );
}
