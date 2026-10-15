import type { Difficulty, Ingredient, RecipeInput } from '../models/Recipe.js';

/** Структура записи блюда в ответе TheMealDB API */
export interface MealDbMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string | null;
  strArea: string | null;
  strInstructions: string | null;
  strMealThumb: string | null;
  strTags: string | null;
  [key: string]: string | null;
}

export interface ExternalRecipePreview {
  externalId: string;
  title: string;
  category: string;
  cuisine: string;
  imageUrl: string | null;
  tags: string[];
  ingredientsCount: number;
}

export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

type FetchFn = typeof fetch;

const CATEGORY_MAP: Record<string, string> = {
  Breakfast: 'Завтраки',
  Dessert: 'Десерты',
  Starter: 'Закуски',
  Side: 'Закуски',
  Beef: 'Основные блюда',
  Chicken: 'Основные блюда',
  Lamb: 'Основные блюда',
  Pork: 'Основные блюда',
  Goat: 'Основные блюда',
  Seafood: 'Основные блюда',
  Pasta: 'Основные блюда',
  Vegetarian: 'Основные блюда',
  Vegan: 'Основные блюда',
  Miscellaneous: 'Основные блюда',
};

const AREA_MAP: Record<string, string> = {
  American: 'Американская',
  British: 'Британская',
  Canadian: 'Канадская',
  Chinese: 'Китайская',
  Dutch: 'Нидерландская',
  French: 'Французская',
  Greek: 'Греческая',
  Indian: 'Индийская',
  Italian: 'Итальянская',
  Japanese: 'Японская',
  Mexican: 'Мексиканская',
  Polish: 'Польская',
  Russian: 'Русская',
  Spanish: 'Испанская',
  Thai: 'Тайская',
  Turkish: 'Турецкая',
  Ukrainian: 'Украинская',
  Venezulan: 'Венесуэльская',
};

const UNIT_MAP: Array<[RegExp, string]> = [
  [/^(g|gr|gram|grams)$/i, 'г'],
  [/^(kg|kilo|kilogram)s?$/i, 'кг'],
  [/^(ml|millilitres?|milliliters?)$/i, 'мл'],
  [/^(l|litres?|liters?)$/i, 'л'],
  [/^(tbsp|tbs|tblsp|tablespoons?)$/i, 'ст. л.'],
  [/^(tsp|teaspoons?)$/i, 'ч. л.'],
  [/^cups?$/i, 'стакан'],
  [/^pinch$/i, 'щепотка'],
];

interface CacheEntry<T> {
  value: T;
  expires: number;
}

/**
 * Клиент внешнего API TheMealDB.
 * Выполняет запросы с таймаутом, кэширует ответы и преобразует
 * данные внешнего формата во внутреннюю модель рецепта.
 */
export class MealDbService {
  private cache = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly baseUrl = 'https://www.themealdb.com/api/json/v1/1',
    private readonly fetchFn: FetchFn = fetch,
    private readonly ttlMs = 10 * 60 * 1000,
    private readonly timeoutMs = 8000,
  ) {}

  async search(query: string): Promise<ExternalRecipePreview[]> {
    const meals = await this.request(`/search.php?s=${encodeURIComponent(query.trim())}`);
    return meals.map((m) => this.toPreview(m));
  }

  async getById(externalId: string): Promise<RecipeInput | null> {
    const meals = await this.request(`/lookup.php?i=${encodeURIComponent(externalId)}`);
    return meals.length > 0 ? MealDbService.toRecipeInput(meals[0]) : null;
  }

  async random(): Promise<ExternalRecipePreview | null> {
    // Случайный рецепт не кэшируется
    const meals = await this.request('/random.php', false);
    return meals.length > 0 ? this.toPreview(meals[0]) : null;
  }

  private async request(path: string, useCache = true): Promise<MealDbMeal[]> {
    const cached = this.cache.get(path);
    if (useCache && cached && cached.expires > Date.now()) return cached.value as MealDbMeal[];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}${path}`, { signal: controller.signal });
    } catch {
      throw new ExternalApiError('Внешний сервис рецептов недоступен', 503);
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) {
      throw new ExternalApiError(`Внешний сервис вернул ошибку ${response.status}`);
    }
    const body = (await response.json()) as { meals: MealDbMeal[] | null | string };
    const meals = Array.isArray(body.meals) ? body.meals : [];
    if (useCache) this.cache.set(path, { value: meals, expires: Date.now() + this.ttlMs });
    return meals;
  }

  private toPreview(meal: MealDbMeal): ExternalRecipePreview {
    return {
      externalId: meal.idMeal,
      title: meal.strMeal,
      category: MealDbService.mapCategory(meal.strCategory),
      cuisine: MealDbService.mapArea(meal.strArea),
      imageUrl: meal.strMealThumb,
      tags: MealDbService.parseTags(meal.strTags),
      ingredientsCount: MealDbService.extractIngredients(meal).length,
    };
  }

  // ---------- Статические функции преобразования (чистые, легко тестируются) ----------

  static mapCategory(category: string | null): string {
    return (category && CATEGORY_MAP[category]) || 'Основные блюда';
  }

  static mapArea(area: string | null): string {
    if (!area || area === 'Unknown') return '';
    return AREA_MAP[area] ?? area;
  }

  static parseTags(tags: string | null): string[] {
    return (tags ?? '')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }

  /** Разбирает строку меры вида «1/2 tsp», «200g», «2 large» на количество и единицу. */
  static parseMeasure(measure: string | null): Pick<Ingredient, 'amount' | 'unit'> {
    const text = (measure ?? '').trim();
    if (!text || /to taste|to serve|garnish/i.test(text)) return { amount: null, unit: 'по вкусу' };

    const match = text.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?)\s*(.*)$/);
    if (!match) {
      const unit = MealDbService.mapUnit(text);
      return { amount: null, unit };
    }
    const [, num, rest] = match;
    return { amount: MealDbService.parseNumber(num), unit: MealDbService.mapUnit(rest.trim()) };
  }

  static parseNumber(value: string): number {
    const mixed = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    const fraction = value.match(/^(\d+)\/(\d+)$/);
    if (fraction) return Number(fraction[1]) / Number(fraction[2]);
    return Number(value.replace(',', '.'));
  }

  static mapUnit(unit: string): string {
    if (!unit) return 'шт';
    const firstWord = unit.split(/\s+/)[0];
    for (const [pattern, ru] of UNIT_MAP) {
      if (pattern.test(firstWord)) return ru;
    }
    return unit;
  }

  static extractIngredients(meal: MealDbMeal): Ingredient[] {
    const result: Ingredient[] = [];
    for (let i = 1; i <= 20; i++) {
      const name = (meal[`strIngredient${i}`] ?? '').trim();
      if (!name) continue;
      result.push({ name, ...MealDbService.parseMeasure(meal[`strMeasure${i}`]) });
    }
    return result;
  }

  static splitSteps(instructions: string | null): string[] {
    const lines = (instructions ?? '')
      .split(/\r?\n+/)
      .map((l) => l.replace(/^\s*(step\s*\d+[:.)]?|\d+[.)])\s*/i, '').trim())
      .filter((l) => l.length > 2);
    if (lines.length > 1) return lines;
    // Одним абзацем — делим по предложениям, группируя по два
    const sentences = (lines[0] ?? '').split(/(?<=[.!?])\s+/).filter(Boolean);
    const steps: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) steps.push(sentences.slice(i, i + 2).join(' '));
    return steps;
  }

  static estimateDifficulty(ingredients: number, steps: number): Difficulty {
    if (ingredients > 12 || steps > 8) return 'hard';
    if (ingredients > 7 || steps > 4) return 'medium';
    return 'easy';
  }

  static toRecipeInput(meal: MealDbMeal): RecipeInput {
    const ingredients = MealDbService.extractIngredients(meal);
    const steps = MealDbService.splitSteps(meal.strInstructions);
    return {
      title: meal.strMeal,
      description: 'Рецепт импортирован из открытой базы TheMealDB. Время приготовления указано ориентировочно.',
      category: MealDbService.mapCategory(meal.strCategory),
      cuisine: MealDbService.mapArea(meal.strArea),
      servings: 4,
      prepTime: 15,
      cookTime: Math.min(120, Math.max(10, steps.length * 10)),
      difficulty: MealDbService.estimateDifficulty(ingredients.length, steps.length),
      ingredients,
      steps,
      tags: MealDbService.parseTags(meal.strTags),
      imageUrl: meal.strMealThumb,
      source: 'themealdb',
      externalId: meal.idMeal,
    };
  }
}
