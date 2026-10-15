import type { Recipe, RecipeFilters } from '../models/types';

export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RecipesState {
  items: Recipe[];
  status: LoadStatus;
  error: string | null;
  filters: RecipeFilters;
  /** Счётчик внешних изменений: увеличивается при событиях реального времени */
  revision: number;
}

export type RecipesAction =
  | { type: 'load/start' }
  | { type: 'load/success'; items: Recipe[] }
  | { type: 'load/error'; error: string }
  | { type: 'filters/set'; patch: Partial<RecipeFilters> }
  | { type: 'filters/reset' }
  | { type: 'recipe/upsert'; recipe: Recipe }
  | { type: 'recipe/remove'; id: string }
  | { type: 'remote/changed' };

export const defaultFilters: RecipeFilters = {
  search: '',
  category: '',
  difficulty: '',
  maxTime: '',
  sort: 'new',
};

export const initialState: RecipesState = {
  items: [],
  status: 'idle',
  error: null,
  filters: defaultFilters,
  revision: 0,
};

/** Чистая функция-редьюсер: вычисляет новое состояние каталога по действию. */
export function recipesReducer(state: RecipesState, action: RecipesAction): RecipesState {
  switch (action.type) {
    case 'load/start':
      return { ...state, status: 'loading', error: null };
    case 'load/success':
      return { ...state, status: 'success', items: action.items };
    case 'load/error':
      return { ...state, status: 'error', error: action.error };
    case 'filters/set':
      return { ...state, filters: { ...state.filters, ...action.patch } };
    case 'filters/reset':
      return { ...state, filters: defaultFilters };
    case 'recipe/upsert': {
      const exists = state.items.some((r) => r.id === action.recipe.id);
      return {
        ...state,
        items: exists
          ? state.items.map((r) => (r.id === action.recipe.id ? action.recipe : r))
          : [action.recipe, ...state.items],
      };
    }
    case 'recipe/remove':
      return { ...state, items: state.items.filter((r) => r.id !== action.id) };
    case 'remote/changed':
      return { ...state, revision: state.revision + 1 };
    default:
      return state;
  }
}
