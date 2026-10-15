import { Component, type ErrorInfo, type ReactNode } from 'react';
import { EmptyState } from '../empty-state/EmptyState';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Классовый компонент — «предохранитель» (Error Boundary).
 * Перехватывает исключения при отрисовке дочерних компонентов
 * и показывает запасной интерфейс вместо белого экрана.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Ошибка интерфейса:', error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <EmptyState
          tone="error"
          icon="🔥"
          title="Что-то пригорело"
          text="Во время отображения страницы произошла ошибка. Попробуйте ещё раз."
          action={
            <button type="button" className="button button--primary" onClick={this.reset}>
              Повторить
            </button>
          }
        />
      );
    }
    return this.props.children;
  }
}
