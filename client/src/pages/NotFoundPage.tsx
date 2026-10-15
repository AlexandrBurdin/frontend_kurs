import { ButtonLink } from '../blocks/button/Button';
import { EmptyState } from '../blocks/empty-state/EmptyState';
import '../blocks/page/page.css';

export function NotFoundPage() {
  return (
    <main className="page">
      <EmptyState
        icon="🍳"
        title="Страница не найдена"
        text="Возможно, рецепт был удалён или ссылка набрана с ошибкой."
        action={<ButtonLink to="/">На главную</ButtonLink>}
      />
    </main>
  );
}
