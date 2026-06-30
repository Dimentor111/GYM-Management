import { useToastStore } from '../../store/toastStore';

export function Toast() {
  const message = useToastStore((s) => s.message);
  const color = useToastStore((s) => s.color);
  if (!message) return null;
  return (
    <div className="toast">
      <div className="tdot" style={{ background: color }} />
      <span>{message}</span>
    </div>
  );
}
