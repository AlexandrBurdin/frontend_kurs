import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { ShoppingList } from '../models/ShoppingList';
import type { Ingredient } from '../models/types';

interface UserDataContextValue {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  shoppingList: ShoppingList;
  addToShoppingList: (recipeTitle: string, ingredients: Ingredient[]) => void;
  updateShoppingList: (fn: (list: ShoppingList) => ShoppingList) => void;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

const serializeList = (l: ShoppingList) => l.toJSON();
const deserializeList = (raw: string | null) => ShoppingList.fromJSON(raw);
const serializeIds = (ids: string[]) => JSON.stringify(ids);
const deserializeIds = (raw: string | null): string[] => (raw ? (JSON.parse(raw) as string[]) : []);

/** Персональные данные пользователя: избранное и список покупок (хранятся в браузере). */
export function UserDataProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>('rb:favorites', [], serializeIds, deserializeIds);
  const [shoppingList, setShoppingList] = usePersistentState<ShoppingList>(
    'rb:shopping',
    ShoppingList.empty(),
    serializeList,
    deserializeList,
  );

  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);
  const toggleFavorite = useCallback(
    (id: string) => setFavoriteIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])),
    [setFavoriteIds],
  );
  const addToShoppingList = useCallback(
    (title: string, ingredients: Ingredient[]) => setShoppingList((l) => l.addIngredients(title, ingredients)),
    [setShoppingList],
  );
  const updateShoppingList = useCallback(
    (fn: (list: ShoppingList) => ShoppingList) => setShoppingList(fn),
    [setShoppingList],
  );

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, shoppingList, addToShoppingList, updateShoppingList }),
    [favorites, isFavorite, toggleFavorite, shoppingList, addToShoppingList, updateShoppingList],
  );
  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData(): UserDataContextValue {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData должен использоваться внутри UserDataProvider');
  return ctx;
}
