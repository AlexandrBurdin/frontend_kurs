import type { ReactNode } from 'react';
import './empty-state.css';

interface Props {
  icon: string;
  title: string;
  text?: string;
  action?: ReactNode;
  tone?: 'neutral' | 'error';
}

export function EmptyState({ icon, title, text, action, tone = 'neutral' }: Props) {
  return (
    <div className={`empty-state empty-state--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <span className="empty-state__icon" aria-hidden="true">
        {icon}
      </span>
      <h2 className="empty-state__title">{title}</h2>
      {text && <p className="empty-state__text">{text}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
