import { RecipeModel } from '../../models/RecipeModel';
import type { ShoppingList } from '../../models/ShoppingList';
import './shopping-list.css';

interface Props {
  list: ShoppingList;
  onToggle: (key: string) => void;
  onRemove: (key: string) => void;
}

export function ShoppingListView({ list, onToggle, onRemove }: Props) {
  return (
    <ul className="shopping-list">
      {list.items.map((item) => (
        <li key={item.key} className={`shopping-list__item${item.checked ? ' shopping-list__item--checked' : ''}`}>
          <label className="shopping-list__label">
            <input
              type="checkbox"
              className="shopping-list__checkbox"
              checked={item.checked}
              onChange={() => onToggle(item.key)}
            />
            <span className="shopping-list__name">{item.name}</span>
            <span className="shopping-list__amount">{RecipeModel.formatIngredient(item)}</span>
          </label>
          <span className="shopping-list__recipes">{item.recipes.join(', ')}</span>
          <button
            type="button"
            className="shopping-list__remove"
            aria-label={`Удалить «${item.name}»`}
            onClick={() => onRemove(item.key)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
