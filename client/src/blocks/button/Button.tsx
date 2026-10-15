import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import './button.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'm' | 's';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

/** Формирует БЭМ-классы блока button по модификаторам. */
export function buttonClass({ variant = 'primary', size = 'm', loading }: CommonProps, extra?: string): string {
  return ['button', `button--${variant}`, size === 's' && 'button--small', loading && 'button--loading', extra]
    .filter(Boolean)
    .join(' ');
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant, size, icon, loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonClass({ variant, size, loading }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon && (
        <span className="button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="button__text">{children}</span>
    </button>
  );
}

type ButtonLinkProps = CommonProps & LinkProps;

/** Ссылка, оформленная как кнопка (наследует внешний вид блока button). */
export function ButtonLink({ variant, size, icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size }, className)} {...rest}>
      {icon && (
        <span className="button__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="button__text">{children}</span>
    </Link>
  );
}
