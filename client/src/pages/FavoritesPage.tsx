import { useEffect, useState } from 'react';
import { recipeApi } from '../api';
import { ButtonLink } from '../blocks/button/Button';
import { EmptyState } from '../blocks/empty-state/EmptyState';
import { RecipeGrid } from '../blocks/recipe-grid/RecipeGrid';
import type { Recipe } from '../models/types';
import { useRecipes } from '../store/RecipesContext';
import { useUserData } from '../store/UserDataContext';
import '../blocks/page/page.css';

export function FavoritesPage() {
  const { favorites } = useUserData();
  const { revision } = useRecipes();
  const [all, setAll] = useState<Recipe[] | null>(null);

  // Избранное считается от полного списка, независимо от фильтров каталога
  useEffect(() => {
    recipeApi
      .list()
      .then(setAll)
      .catch(() => setAll([]));
  }, [revision]);

  const items = (all ?? []).filter((r) => favorites.has(r.id));

  return (
    <main className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Избранное</h1>
          <p className="page__subtitle">Рецепты, отмеченные сердечком, хранятся на этом устройстве</p>
        </div>
      </div>
      {all !== null && items.length === 0 ? (
        <EmptyState
          icon="♡"
          title="Пока пусто"
          text="Нажмите на сердечко на карточке рецепта, чтобы добавить его сюда."
          action={<ButtonLink to="/">Перейти к рецептам</ButtonLink>}
        />
      ) : (
        <RecipeGrid recipes={items} loading={all === null} />
      )}
    </main>
  );
}
