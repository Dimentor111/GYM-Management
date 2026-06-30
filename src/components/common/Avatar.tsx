import { initials } from '../../utils/validation';

/** Round gradient avatar showing up to two initials of a name. */
export function Avatar({ name, className = 'avatar' }: { name: string | null | undefined; className?: string }) {
  return <div className={className}>{initials(name)}</div>;
}
