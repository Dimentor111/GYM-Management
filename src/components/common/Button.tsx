import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'success' | 'danger' | 'amber';
type Size = 'md' | 'sm' | 'xs' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  success: 'btn-success',
  danger: 'btn-danger',
  amber: 'btn-amber',
};

const SIZE_CLASS: Record<Size, string> = {
  md: '',
  sm: 'btn-sm',
  xs: 'btn-xs',
  lg: 'btn-lg',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, type = 'button', ...rest }: ButtonProps) {
  const cls = ['btn', VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
