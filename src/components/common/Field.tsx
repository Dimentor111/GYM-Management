import type { ReactNode } from 'react';

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
}

/** Labeled form-field wrapper matching the original `.fg` layout. */
export function Field({ label, children, hint }: FieldProps) {
  return (
    <div className="fg">
      <label>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

interface FormRowProps {
  cols?: 2 | 3;
  children: ReactNode;
}

/** Grid row of fields (`.frow.c2` / `.frow.c3`). */
export function FormRow({ cols = 2, children }: FormRowProps) {
  return <div className={`frow c${cols}`}>{children}</div>;
}
