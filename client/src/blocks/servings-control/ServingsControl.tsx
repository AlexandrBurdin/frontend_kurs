import { RecipeModel } from '../../models/RecipeModel';
import './servings-control.css';

interface Props {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

/** Счётчик порций: изменение значения пересчитывает количество ингредиентов. */
export function ServingsControl({ value, min = 1, max = 50, onChange }: Props) {
  return (
    <div className="servings-control" role="group" aria-label="Количество порций">
      <button
        type="button"
        className="servings-control__button"
        aria-label="Уменьшить количество порций"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <output className="servings-control__value" aria-live="polite">
        <b>{value}</b> {RecipeModel.plural(value, ['порция', 'порции', 'порций'])}
      </output>
      <button
        type="button"
        className="servings-control__button"
        aria-label="Увеличить количество порций"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
