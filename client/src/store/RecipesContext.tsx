import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { CLIENT_ID, EVENTS_URL, recipeApi } from '../api';
import { ApiError } from '../api/HttpClient';
import { useDebounce } from '../hooks/useDebounce';
import { useRealtime, type ConnectionState, type RealtimeEvent } from '../hooks/useRealtime';
import type { Recipe, RecipeFilters, RecipeInput } from '../models/types';
import { initialState, recipesReducer, type RecipesState } from './recipesReducer';
import { useToast } from './ToastContext';

interface RecipesContextValue extends RecipesState {
  connection: ConnectionState;
  setFilters: (patch: Partial<RecipeFilters>) => void;
  resetFilters: () => void;
  saveRecipe: (input: RecipeInput, id?: string) => Promise<Recipe>;
  deleteRecipe: (id: string) => Promise<void>;
  upsertLocal: (recipe: Recipe) => void;
  reload: () => void;
}

const RecipesContext = createContext<RecipesContextValue | null>(null);

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(recipesReducer, initialState);
  const { notify } = useToast();
  const search = useDebounce(state.filters.search, 300);
  const { category, difficulty, maxTime, sort } = state.filters;

  // Загрузка каталога при изменении фильтров или внешних изменениях
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'load/start' });
    recipeApi
      .list({ search, category, difficulty, maxTime, sort })
      .then((items) => !cancelled && dispatch({ type: 'load/success', items }))
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({
            type: 'load/error',
            error: err instanceof ApiError ? err.message : 'Не удалось загрузить рецепты',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [search, category, difficulty, maxTime, sort, state.revision]);

  const handleRealtime = useCallback(
    (event: RealtimeEvent) => {
      if (event.own) return;
      dispatch({ type: 'remote/changed' });
      if (event.type === 'recipe:created') notify(`Добавлен новый рецепт: «${event.recipe.title}»`, 'info');
      if (event.type === 'recipe:updated') notify(`Рецепт «${event.recipe.title}» обновлён`, 'info');
      if (event.type === 'recipe:deleted') notify('Один из рецептов был удалён', 'info');
    },
    [notify],
  );
  const connection = useRealtime(EVENTS_URL, CLIENT_ID, handleRealtime);

  const setFilters = useCallback((patch: Partial<RecipeFilters>) => dispatch({ type: 'filters/set', patch }), []);
  const resetFilters = useCallback(() => dispatch({ type: 'filters/reset' }), []);
  const reload = useCallback(() => dispatch({ type: 'remote/changed' }), []);
  const upsertLocal = useCallback((recipe: Recipe) => dispatch({ type: 'recipe/upsert', recipe }), []);

  const saveRecipe = useCallback(async (input: RecipeInput, id?: string) => {
    const saved = id ? await recipeApi.update(id, input) : await recipeApi.create(input);
    dispatch({ type: 'recipe/upsert', recipe: saved });
    return saved;
  }, []);

  const deleteRecipe = useCallback(async (id: string) => {
    await recipeApi.remove(id);
    dispatch({ type: 'recipe/remove', id });
  }, []);

  const value = useMemo(
    () => ({ ...state, connection, setFilters, resetFilters, saveRecipe, deleteRecipe, upsertLocal, reload }),
    [state, connection, setFilters, resetFilters, saveRecipe, deleteRecipe, upsertLocal, reload],
  );
  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>;
}

export function useRecipes(): RecipesContextValue {
  const ctx = useContext(RecipesContext);
  if (!ctx) throw new Error('useRecipes должен использоваться внутри RecipesProvider');
  return ctx;
}
