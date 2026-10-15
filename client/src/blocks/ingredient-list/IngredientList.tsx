import { useState } from 'react';
import { RecipeModel } from '../../models/RecipeModel';
import type { Ingredient } from '../../models/types';
import './ingredient-list.css';

interface Props {
  ingredients: Ingredient[];
}

/** Список ингредиентов с возможностью отмечать уже подготовленные продукты. */
export function IngredientList({ ingredients }: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (index: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <ul className="ingredient-list">
      {ingredients.map((ing, i) => (
        <li
          key={`${ing.name}-${i}`}
          className={`ingredient-list__item${checked.has(i) ? ' ingredient-list__item--checked' : ''}`}
        >
          <label className="ingredient-list__label">
            <input
              type="checkbox"
              className="ingredient-list__checkbox"
              checked={checked.has(i)}
              onChange={() => toggle(i)}
            />
            <span className="ingredient-list__name">{ing.name}</span>
            <span className="ingredient-list__amount" data-testid="ingredient-amount">
              {RecipeModel.formatIngredient(ing)}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
