import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MealDbMeal } from '../src/services/MealDbService.js';

export const fixtureMeals: MealDbMeal[] = JSON.parse(
  readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../e2e/fixtures/mealdb-meals.json'),
    'utf-8',
  ),
);

export function tempDataFile(): string {
  return path.join(mkdtempSync(path.join(tmpdir(), 'recipes-')), 'recipes.json');
}

/** Поддельная реализация fetch, имитирующая TheMealDB по фикстурам. */
export function fakeMealDbFetch(calls: string[] = []): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    calls.push(url.pathname + url.search);
    let meals: MealDbMeal[] | null = null;
    if (url.pathname.endsWith('/search.php')) {
      const q = (url.searchParams.get('s') ?? '').toLowerCase();
      const found = fixtureMeals.filter((m) => m.strMeal.toLowerCase().includes(q));
      meals = found.length ? found : null;
    } else if (url.pathname.endsWith('/lookup.php')) {
      const found = fixtureMeals.filter((m) => m.idMeal === url.searchParams.get('i'));
      meals = found.length ? found : null;
    } else if (url.pathname.endsWith('/random.php')) {
      meals = [fixtureMeals[0]];
    }
    return new Response(JSON.stringify({ meals }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
}

export const validRecipe = {
  title: 'Омлет с зеленью',
  description: 'Пышный омлет на завтрак',
  category: 'Завтраки',
  cuisine: 'Французская',
  servings: 2,
  prepTime: 5,
  cookTime: 10,
  difficulty: 'easy',
  ingredients: [
    { name: 'Яйцо', amount: 4, unit: 'шт' },
    { name: 'Молоко', amount: 100, unit: 'мл' },
    { name: 'Соль', amount: null, unit: 'по вкусу' },
  ],
  steps: ['Взбейте яйца с молоком', 'Жарьте под крышкой 7 минут'],
  tags: ['Быстро', 'быстро', 'яйца'],
  imageUrl: '',
};
