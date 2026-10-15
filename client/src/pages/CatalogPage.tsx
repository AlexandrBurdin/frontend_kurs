import { FilterBar } from '../blocks/filter-bar/FilterBar';
import { RecipeGrid } from '../blocks/recipe-grid/RecipeGrid';
import { EmptyState } from '../blocks/empty-state/EmptyState';
import { Button, ButtonLink } from '../blocks/button/Button';
import { useRecipes } from '../store/RecipesContext';
import '../blocks/page/page.css';

export function CatalogPage() {
  const { items, status, error, filters, setFilters, resetFilters, reload } = useRecipes();

  return (
    <main className="page">
      <section className="page__hero">
        <h1 className="page__hero-title">Ваша личная книга рецептов</h1>
        <p className="page__hero-text">
          Записывайте любимые блюда, пересчитывайте ингредиенты на нужное число порций и находите новые идеи в открытой
          базе рецептов.
        </p>
      </section>

      <FilterBar filters={filters} total={items.length} onChange={setFilters} onReset={resetFilters} />

      {status === 'error' ? (
        <EmptyState
          tone="error"
          icon="⚠️"
          title="Не удалось загрузить рецепты"
          text={error ?? undefined}
          action={<Button onClick={reload}>Повторить</Button>}
        />
      ) : status === 'success' && items.length === 0 ? (
        <EmptyState
          icon="🥄"
          title="Ничего не найдено"
          text="Измените условия поиска или добавьте новый рецепт."
          action={<ButtonLink to="/recipes/new">Добавить рецепт</ButtonLink>}
        />
      ) : (
        <RecipeGrid recipes={items} loading={status === 'loading' || status === 'idle'} />
      )}
    </main>
  );
}
