import { describe, expect, it } from 'vitest';
import { ExternalApiError, MealDbService } from '../src/services/MealDbService.js';
import { fakeMealDbFetch, fixtureMeals } from './helpers.js';

describe('MealDbService: преобразование данных', () => {
  it.each([
    ['100g', 100, 'г'],
    ['300ml', 300, 'мл'],
    ['1/2 tsp', 0.5, 'ч. л.'],
    ['1 1/2 cups', 1.5, 'стакан'],
    ['2 tbs', 2, 'ст. л.'],
    ['2 large', 2, 'large'],
    ['1', 1, 'шт'],
    ['pinch', null, 'щепотка'],
    ['to serve', null, 'по вкусу'],
    ['', null, 'по вкусу'],
  ])('разбирает меру «%s»', (measure, amount, unit) => {
    expect(MealDbService.parseMeasure(measure)).toEqual({ amount, unit });
  });

  it('делит инструкции на шаги и удаляет пометки STEP', () => {
    const steps = MealDbService.splitSteps(fixtureMeals[1].strInstructions);
    expect(steps).toHaveLength(3);
    expect(steps[0]).toBe('Mash the bananas in a bowl until smooth.');
  });

  it('делит инструкцию из одного абзаца по предложениям', () => {
    const steps = MealDbService.splitSteps(fixtureMeals[2].strInstructions);
    expect(steps.length).toBe(3);
  });

  it('преобразует блюдо во внутреннюю модель рецепта', () => {
    const recipe = MealDbService.toRecipeInput(fixtureMeals[0]);
    expect(recipe).toMatchObject({
      title: 'Pancakes',
      category: 'Десерты',
      cuisine: 'Американская',
      source: 'themealdb',
      externalId: '90001',
      tags: ['breakfast', 'sweet'],
    });
    expect(recipe.ingredients).toHaveLength(6);
    expect(recipe.steps).toHaveLength(5);
  });
});

describe('MealDbService: сетевое взаимодействие', () => {
  it('ищет рецепты и кэширует повторный запрос', async () => {
    const calls: string[] = [];
    const service = new MealDbService('https://api.test', fakeMealDbFetch(calls));
    const first = await service.search('pancakes');
    const second = await service.search('pancakes');
    expect(first).toHaveLength(3);
    expect(second).toEqual(first);
    expect(calls).toHaveLength(1);
  });

  it('возвращает пустой список, если ничего не найдено', async () => {
    const service = new MealDbService('https://api.test', fakeMealDbFetch());
    expect(await service.search('zzzz')).toEqual([]);
  });

  it('преобразует сетевой сбой в ExternalApiError со статусом 503', async () => {
    const failing = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    const service = new MealDbService('https://api.test', failing);
    await expect(service.search('soup')).rejects.toMatchObject({ name: 'ExternalApiError', status: 503 });
  });

  it('сообщает об HTTP-ошибке внешнего сервиса', async () => {
    const error500 = (async () => new Response('fail', { status: 500 })) as typeof fetch;
    const service = new MealDbService('https://api.test', error500);
    await expect(service.getById('1')).rejects.toBeInstanceOf(ExternalApiError);
  });
});
