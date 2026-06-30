import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/** Overlay modal with header, body and optional footer. Closes on backdrop
 * click and the Escape key. */
export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal${wide ? ' modal-wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-title">{title}</div>
          <button className="xbtn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
        {footer && <div className="modal-ft">{footer}</div>}
      </div>
    </div>
  );
}
