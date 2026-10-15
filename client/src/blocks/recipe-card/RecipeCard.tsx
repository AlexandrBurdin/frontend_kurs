import { memo } from 'react';
import { Link } from 'react-router-dom';
import { RecipeModel } from '../../models/RecipeModel';
import type { Recipe } from '../../models/types';
import { RecipeCover } from '../recipe-cover/RecipeCover';
import './recipe-card.css';

interface Props {
  recipe: Recipe;
  index?: number;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
}

function RecipeCardComponent({ recipe, index = 0, favorite, onToggleFavorite }: Props) {
  const model = new RecipeModel(recipe);

  return (
    <article className="recipe-card" style={{ '--i': index } as React.CSSProperties} data-testid="recipe-card">
      <Link to={`/recipes/${recipe.id}`} className="recipe-card__link">
        <div className="recipe-card__media">
          <RecipeCover title={recipe.title} category={recipe.category} imageUrl={recipe.imageUrl} />
          <span className="recipe-card__category">{recipe.category}</span>
        </div>
        <div className="recipe-card__body">
          <h3 className="recipe-card__title">{recipe.title}</h3>
          {recipe.description && <p className="recipe-card__description">{recipe.description}</p>}
          <ul className="recipe-card__meta" aria-label="Характеристики">
            <li className="recipe-card__meta-item">⏱ {model.formattedTime}</li>
            <li className={`recipe-card__meta-item recipe-card__meta-item--${recipe.difficulty}`}>
              {model.difficultyLabel}
            </li>
            <li className="recipe-card__meta-item">
              🍽 {recipe.servings} {RecipeModel.plural(recipe.servings, ['порция', 'порции', 'порций'])}
            </li>
          </ul>
        </div>
      </Link>
      <button
        type="button"
        className={`recipe-card__favorite${favorite ? ' recipe-card__favorite--active' : ''}`}
        aria-pressed={favorite}
        aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        onClick={() => onToggleFavorite(recipe.id)}
      >
        {favorite ? '♥' : '♡'}
      </button>
    </article>
  );
}

/** Карточка рецепта в каталоге. memo предотвращает лишние перерисовки при обновлении списка. */
export const RecipeCard = memo(RecipeCardComponent);
