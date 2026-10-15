import type { Recipe } from '../../models/types';
import { useUserData } from '../../store/UserDataContext';
import { RecipeCard } from '../recipe-card/RecipeCard';
import './recipe-grid.css';

interface Props {
  recipes: Recipe[];
  loading?: boolean;
}

/** Адаптивная сетка карточек; при первой загрузке показывает «скелетоны». */
export function RecipeGrid({ recipes, loading = false }: Props) {
  const { isFavorite, toggleFavorite } = useUserData();

  if (loading && recipes.length === 0) {
    return (
      <div className="recipe-grid" aria-busy="true" aria-label="Загрузка рецептов">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="recipe-grid__skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className={`recipe-grid${loading ? ' recipe-grid--refreshing' : ''}`}>
      {recipes.map((recipe, i) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          index={i}
          favorite={isFavorite(recipe.id)}
          onToggleFavorite={toggleFavorite}
        />
      ))}
    </div>
  );
}
