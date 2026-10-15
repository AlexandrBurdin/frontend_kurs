/**
 * Доменная модель рецепта и правила её проверки.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type RecipeSource = 'user' | 'themealdb';

export const CATEGORIES = [
  'Завтраки',
  'Супы',
  'Основные блюда',
  'Салаты',
  'Выпечка',
  'Десерты',
  'Напитки',
  'Закуски',
] as const;

export const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'ст. л.', 'ч. л.', 'стакан', 'щепотка', 'по вкусу'] as const;

export interface Ingredient {
  name: string;
  /** null — количество не задано («по вкусу») */
  amount: number | null;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  cuisine: string;
  servings: number;
  prepTime: number; // минуты
  cookTime: number; // минуты
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  imageUrl: string | null;
  source: RecipeSource;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Данные, которые клиент передаёт при создании/изменении рецепта. */
export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Валидатор входных данных рецепта.
 * Инкапсулирует правила проверки и нормализацию значений.
 */
export class RecipeValidator {
  private errors: ValidationError[] = [];

  validate(raw: unknown): { value: RecipeInput | null; errors: ValidationError[] } {
    this.errors = [];
    if (typeof raw !== 'object' || raw === null) {
      return { value: null, errors: [{ field: 'body', message: 'Ожидался объект рецепта' }] };
    }
    const data = raw as Record<string, unknown>;

    const title = this.requireString(data.title, 'title', 'Название', 3, 120);
    const description = this.optionalString(data.description, 500);
    const category = this.requireString(data.category, 'category', 'Категория', 2, 40);
    const cuisine = this.optionalString(data.cuisine, 40);
    const servings = this.requireInt(data.servings, 'servings', 'Количество порций', 1, 50);
    const prepTime = this.requireInt(data.prepTime, 'prepTime', 'Время подготовки', 0, 1440);
    const cookTime = this.requireInt(data.cookTime, 'cookTime', 'Время приготовления', 0, 1440);
    const difficulty = this.difficulty(data.difficulty);
    const ingredients = this.ingredients(data.ingredients);
    const steps = this.steps(data.steps);
    const tags = this.tags(data.tags);
    const imageUrl = this.imageUrl(data.imageUrl);
    const source: RecipeSource = data.source === 'themealdb' ? 'themealdb' : 'user';
    const externalId = typeof data.externalId === 'string' ? data.externalId : null;

    if (this.errors.length > 0) {
      return { value: null, errors: this.errors };
    }
    return {
      value: {
        title,
        description,
        category,
        cuisine,
        servings,
        prepTime,
        cookTime,
        difficulty,
        ingredients,
        steps,
        tags,
        imageUrl,
        source,
        externalId,
      },
      errors: [],
    };
  }

  private add(field: string, message: string): void {
    this.errors.push({ field, message });
  }

  private requireString(v: unknown, field: string, label: string, min: number, max: number): string {
    const s = typeof v === 'string' ? v.trim() : '';
    if (s.length < min) this.add(field, `${label}: не менее ${min} символов`);
    else if (s.length > max) this.add(field, `${label}: не более ${max} символов`);
    return s;
  }

  private optionalString(v: unknown, max: number): string {
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
  }

  private requireInt(v: unknown, field: string, label: string, min: number, max: number): number {
    const n = typeof v === 'string' ? Number(v) : v;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
      this.add(field, `${label}: целое число от ${min} до ${max}`);
      return min;
    }
    return n;
  }

  private difficulty(v: unknown): Difficulty {
    if (v === 'easy' || v === 'medium' || v === 'hard') return v;
    this.add('difficulty', 'Сложность: допустимы значения easy, medium, hard');
    return 'easy';
  }

  private ingredients(v: unknown): Ingredient[] {
    if (!Array.isArray(v) || v.length === 0) {
      this.add('ingredients', 'Добавьте хотя бы один ингредиент');
      return [];
    }
    return v.map((item, i) => {
      const it = (item ?? {}) as Record<string, unknown>;
      const name = typeof it.name === 'string' ? it.name.trim() : '';
      if (!name) this.add(`ingredients[${i}].name`, `Ингредиент №${i + 1}: укажите название`);
      let amount: number | null = null;
      if (it.amount !== null && it.amount !== undefined && it.amount !== '') {
        const n = Number(it.amount);
        if (!Number.isFinite(n) || n <= 0) {
          this.add(`ingredients[${i}].amount`, `Ингредиент №${i + 1}: количество должно быть положительным`);
        } else {
          amount = n;
        }
      }
      const unit = typeof it.unit === 'string' ? it.unit.trim() : '';
      return { name, amount, unit };
    });
  }

  private steps(v: unknown): string[] {
    const steps = Array.isArray(v)
      ? v
          .filter((s): s is string => typeof s === 'string')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (steps.length === 0) this.add('steps', 'Опишите хотя бы один шаг приготовления');
    return steps;
  }

  private tags(v: unknown): string[] {
    if (!Array.isArray(v)) return [];
    const unique = new Set(
      v
        .filter((t): t is string => typeof t === 'string')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    );
    return [...unique].slice(0, 10);
  }

  private imageUrl(v: unknown): string | null {
    if (typeof v !== 'string' || v.trim() === '') return null;
    try {
      const url = new URL(v.trim());
      if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
    } catch {
      /* обработано ниже */
    }
    this.add('imageUrl', 'Ссылка на изображение должна начинаться с http:// или https://');
    return null;
  }
}
