import type { Ingredient } from './types';

export interface ShoppingItem {
  key: string;
  name: string;
  amount: number | null;
  unit: string;
  checked: boolean;
  recipes: string[];
}

/**
 * Список покупок. Объединяет одинаковые ингредиенты из разных рецептов
 * (совпадение по названию и единице измерения) и суммирует их количество.
 * Объект неизменяемый: каждая операция возвращает новый экземпляр,
 * что удобно для хранения в состоянии React.
 */
export class ShoppingList {
  private constructor(private readonly entries: ReadonlyArray<ShoppingItem>) {}

  static empty(): ShoppingList {
    return new ShoppingList([]);
  }

  static fromJSON(json: string | null): ShoppingList {
    if (!json) return ShoppingList.empty();
    try {
      const parsed = JSON.parse(json) as ShoppingItem[];
      return Array.isArray(parsed) ? new ShoppingList(parsed) : ShoppingList.empty();
    } catch {
      return ShoppingList.empty();
    }
  }

  static keyOf(name: string, unit: string): string {
    return `${name.trim().toLowerCase()}|${unit.trim().toLowerCase()}`;
  }

  get items(): ReadonlyArray<ShoppingItem> {
    return this.entries;
  }

  get size(): number {
    return this.entries.length;
  }

  get remaining(): number {
    return this.entries.filter((i) => !i.checked).length;
  }

  addIngredients(recipeTitle: string, ingredients: Ingredient[]): ShoppingList {
    const map = new Map(this.entries.map((i) => [i.key, { ...i, recipes: [...i.recipes] }]));
    for (const ing of ingredients) {
      const key = ShoppingList.keyOf(ing.name, ing.unit);
      const existing = map.get(key);
      if (existing) {
        existing.amount =
          existing.amount === null || ing.amount === null
            ? (existing.amount ?? ing.amount)
            : Math.round((existing.amount + ing.amount) * 100) / 100;
        existing.checked = false;
        if (!existing.recipes.includes(recipeTitle)) existing.recipes.push(recipeTitle);
      } else {
        map.set(key, {
          key,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          checked: false,
          recipes: [recipeTitle],
        });
      }
    }
    return new ShoppingList([...map.values()]);
  }

  toggle(key: string): ShoppingList {
    return new ShoppingList(this.entries.map((i) => (i.key === key ? { ...i, checked: !i.checked } : i)));
  }

  remove(key: string): ShoppingList {
    return new ShoppingList(this.entries.filter((i) => i.key !== key));
  }

  clearChecked(): ShoppingList {
    return new ShoppingList(this.entries.filter((i) => !i.checked));
  }

  toJSON(): string {
    return JSON.stringify(this.entries);
  }
}
