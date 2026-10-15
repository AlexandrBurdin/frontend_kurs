import type { Difficulty, Ingredient, Recipe } from './types';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
};

const CATEGORY_SLUGS: Record<string, string> = {
  Завтраки: 'breakfast',
  Супы: 'soup',
  'Основные блюда': 'main',
  Салаты: 'salad',
  Выпечка: 'bakery',
  Десерты: 'dessert',
  Напитки: 'drink',
  Закуски: 'snack',
};

const CATEGORY_ICONS: Record<string, string> = {
  breakfast: '🍳',
  soup: '🍲',
  main: '🍝',
  salad: '🥗',
  bakery: '🥞',
  dessert: '🍰',
  drink: '🍹',
  snack: '🥖',
};

const FRACTIONS: Array<[number, string]> = [
  [0.25, '¼'],
  [0.333, '⅓'],
  [0.5, '½'],
  [0.667, '⅔'],
  [0.75, '¾'],
];

/**
 * Модель представления рецепта.
 * Инкапсулирует вычисляемые свойства (время, подписи)
 * и бизнес-логику пересчёта ингредиентов на нужное число порций.
 */
export class RecipeModel {
  constructor(private readonly recipe: Recipe) {}

  get data(): Recipe {
    return this.recipe;
  }

  get totalTime(): number {
    return this.recipe.prepTime + this.recipe.cookTime;
  }

  get formattedTime(): string {
    return RecipeModel.formatMinutes(this.totalTime);
  }

  get difficultyLabel(): string {
    return DIFFICULTY_LABELS[this.recipe.difficulty];
  }

  get categorySlug(): string {
    return CATEGORY_SLUGS[this.recipe.category] ?? 'main';
  }

  get icon(): string {
    return CATEGORY_ICONS[this.categorySlug];
  }

  get isImported(): boolean {
    return this.recipe.source === 'themealdb';
  }

  /** Пересчитывает количество ингредиентов пропорционально числу порций. */
  scaleIngredients(servings: number): Ingredient[] {
    const factor = servings / this.recipe.servings;
    return this.recipe.ingredients.map((ing) => ({
      ...ing,
      amount: ing.amount === null ? null : RecipeModel.round(ing.amount * factor),
    }));
  }

  static round(value: number): number {
    if (value >= 100) return Math.round(value);
    if (value >= 10) return Math.round(value * 2) / 2;
    return Math.round(value * 100) / 100;
  }

  /** Форматирует количество: дробные части показываются как ½, ¼ и т.д. */
  static formatAmount(amount: number | null): string {
    if (amount === null) return '';
    const whole = Math.floor(amount);
    const rest = amount - whole;
    if (rest < 0.01) return String(whole);
    const fraction = FRACTIONS.find(([v]) => Math.abs(v - rest) < 0.04);
    if (fraction) return whole === 0 ? fraction[1] : `${whole}${fraction[1]}`;
    return amount.toFixed(1).replace('.', ',');
  }

  static formatIngredient(ing: Ingredient): string {
    const amount = RecipeModel.formatAmount(ing.amount);
    return [amount, ing.unit].filter(Boolean).join(' ');
  }

  static formatMinutes(total: number): string {
    if (total < 60) return `${total} мин`;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m ? `${h} ч ${m} мин` : `${h} ч`;
  }

  static plural(n: number, forms: [string, string, string]): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return forms[0];
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
    return forms[2];
  }

  static categorySlug(category: string): string {
    return CATEGORY_SLUGS[category] ?? 'main';
  }

  static iconFor(category: string): string {
    return CATEGORY_ICONS[RecipeModel.categorySlug(category)];
  }
}
