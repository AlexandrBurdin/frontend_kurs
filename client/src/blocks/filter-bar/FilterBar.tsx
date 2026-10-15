import { CATEGORIES, type RecipeFilters } from '../../models/types';
import { Button } from '../button/Button';
import './filter-bar.css';

interface Props {
  filters: RecipeFilters;
  total: number;
  onChange: (patch: Partial<RecipeFilters>) => void;
  onReset: () => void;
}

/** Панель поиска, фильтрации и сортировки каталога. */
export function FilterBar({ filters, total, onChange, onReset }: Props) {
  const isFiltered =
    filters.search !== '' || filters.category !== '' || filters.difficulty !== '' || filters.maxTime !== '';

  return (
    <section className="filter-bar" aria-label="Поиск и фильтры">
      <div className="filter-bar__search">
        <span className="filter-bar__search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          type="search"
          className="filter-bar__search-input"
          placeholder="Название, ингредиент или тег…"
          aria-label="Поиск рецептов"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>

      <div className="filter-bar__chips" role="group" aria-label="Категории">
        <button
          type="button"
          className={`filter-bar__chip${filters.category === '' ? ' filter-bar__chip--active' : ''}`}
          onClick={() => onChange({ category: '' })}
        >
          Все
        </button>
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c}
            className={`filter-bar__chip${filters.category === c ? ' filter-bar__chip--active' : ''}`}
            aria-pressed={filters.category === c}
            onClick={() => onChange({ category: filters.category === c ? '' : c })}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="filter-bar__row">
        <label className="filter-bar__select">
          <span className="visually-hidden">Сложность</span>
          <select
            className="field__control"
            value={filters.difficulty}
            onChange={(e) => onChange({ difficulty: e.target.value as RecipeFilters['difficulty'] })}
          >
            <option value="">Любая сложность</option>
            <option value="easy">Легко</option>
            <option value="medium">Средне</option>
            <option value="hard">Сложно</option>
          </select>
        </label>
        <label className="filter-bar__select">
          <span className="visually-hidden">Время приготовления</span>
          <select
            className="field__control"
            value={filters.maxTime}
            onChange={(e) => onChange({ maxTime: e.target.value })}
          >
            <option value="">Любое время</option>
            <option value="20">До 20 минут</option>
            <option value="45">До 45 минут</option>
            <option value="90">До 1,5 часа</option>
          </select>
        </label>
        <label className="filter-bar__select">
          <span className="visually-hidden">Сортировка</span>
          <select
            className="field__control"
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as RecipeFilters['sort'] })}
          >
            <option value="new">Сначала новые</option>
            <option value="title">По названию</option>
            <option value="time">Сначала быстрые</option>
          </select>
        </label>
        <span className="filter-bar__total" aria-live="polite">
          Найдено: <b>{total}</b>
        </span>
        {isFiltered && (
          <Button variant="ghost" size="s" onClick={onReset}>
            Сбросить
          </Button>
        )}
      </div>
    </section>
  );
}
