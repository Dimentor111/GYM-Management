import { useConfirmStore } from '../../store/confirmStore';
import { Button } from './Button';

/** Renders the active confirmation request (driven by `confirmDialog()`). */
export function ConfirmDialog() {
  const open = useConfirmStore((s) => s.open);
  const message = useConfirmStore((s) => s.message);
  const answer = useConfirmStore((s) => s.answer);

  if (!open) return null;

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) answer(false);
      }}
    >
      <div className="modal" style={{ maxWidth: 420 }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-title">Please confirm</div>
          <button className="xbtn" onClick={() => answer(false)} aria-label="Close">
            ×
          </button>
        </div>
        <div className="confirm-msg">{message}</div>
        <div className="modal-ft">
          <Button variant="ghost" onClick={() => answer(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => answer(true)}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
