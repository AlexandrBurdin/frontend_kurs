import { useToast } from '../../store/ToastContext';
import './toast-stack.css';

const icons = { success: '✓', error: '!', info: 'i' } as const;

/** Стек всплывающих уведомлений. */
export function ToastStack() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-stack__toast toast-stack__toast--${t.kind}`} role="status">
          <span className="toast-stack__icon" aria-hidden="true">
            {icons[t.kind]}
          </span>
          <span className="toast-stack__text">{t.text}</span>
          <button type="button" className="toast-stack__close" aria-label="Закрыть" onClick={() => dismiss(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
