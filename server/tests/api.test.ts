import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { RecipeRepository } from '../src/repositories/RecipeRepository.js';
import { EventBus, type RecipeEvent } from '../src/services/EventBus.js';
import { MealDbService } from '../src/services/MealDbService.js';
import { seedRecipes } from '../src/seed.js';
import { fakeMealDbFetch, tempDataFile, validRecipe } from './helpers.js';

let app: ReturnType<typeof createApp>;
let events: RecipeEvent[];

beforeEach(() => {
  events = [];
  const bus = new EventBus();
  const originalPublish = bus.publish.bind(bus);
  bus.publish = (e) => {
    events.push(e);
    originalPublish(e);
  };
  app = createApp({
    repo: new RecipeRepository(tempDataFile(), seedRecipes()),
    bus,
    mealDb: new MealDbService('https://api.test', fakeMealDbFetch()),
  });
});

describe('REST API рецептов', () => {
  it('GET /api/recipes возвращает начальные рецепты, новые — первыми', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(8);
    expect(res.body[0].title).toBe('Брускетта с томатами');
  });

  it('фильтрует по категории, поиску и времени', async () => {
    const byCategory = await request(app).get('/api/recipes').query({ category: 'Супы' });
    expect(byCategory.body.map((r: { title: string }) => r.title)).toEqual(['Борщ украинский']);

    const byIngredient = await request(app).get('/api/recipes').query({ search: 'фета' });
    expect(byIngredient.body).toHaveLength(1);

    const quick = await request(app).get('/api/recipes').query({ maxTime: 20, sort: 'time' });
    expect(quick.body.every((r: { prepTime: number; cookTime: number }) => r.prepTime + r.cookTime <= 20)).toBe(true);
  });

  it('создаёт, изменяет и удаляет рецепт, публикуя события', async () => {
    const created = await request(app).post('/api/recipes').set('X-Client-Id', 'tab-1').send(validRecipe);
    expect(created.status).toBe(201);
    expect(created.body.id).toBeTypeOf('string');

    const updated = await request(app)
      .put(`/api/recipes/${created.body.id}`)
      .send({ ...validRecipe, servings: 3 });
    expect(updated.body.servings).toBe(3);

    const removed = await request(app).delete(`/api/recipes/${created.body.id}`);
    expect(removed.status).toBe(204);
    expect((await request(app).get(`/api/recipes/${created.body.id}`)).status).toBe(404);

    expect(events.map((e) => e.type)).toEqual(['recipe:created', 'recipe:updated', 'recipe:deleted']);
    expect(events[0].origin).toBe('tab-1');
  });

  it('возвращает 400 с перечнем ошибок при невалидных данных', async () => {
    const res = await request(app).post('/api/recipes').send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('возвращает 400 при некорректном JSON', async () => {
    const res = await request(app).post('/api/recipes').set('Content-Type', 'application/json').send('{"title":');
    expect(res.status).toBe(400);
  });
});

describe('Интеграция с внешним API', () => {
  it('ищет рецепты во внешнем источнике', async () => {
    const res = await request(app).get('/api/external/search').query({ q: 'pancakes' });
    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({ externalId: '90001', title: 'Pancakes', imported: false });
  });

  it('импортирует рецепт один раз и помечает его как импортированный', async () => {
    const first = await request(app).post('/api/external/import/90002');
    expect(first.status).toBe(201);
    expect(first.body.source).toBe('themealdb');

    const second = await request(app).post('/api/external/import/90002');
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);

    const search = await request(app).get('/api/external/search').query({ q: 'banana' });
    expect(search.body[0].imported).toBe(true);
  });

  it('требует поисковую строку не короче двух символов', async () => {
    const res = await request(app).get('/api/external/search').query({ q: 'a' });
    expect(res.status).toBe(400);
  });

  it('возвращает 503, если внешний сервис недоступен', async () => {
    const offline = createApp({
      repo: new RecipeRepository(tempDataFile(), []),
      mealDb: new MealDbService('https://api.test', (async () => {
        throw new TypeError('network');
      }) as typeof fetch),
    });
    const res = await request(offline).get('/api/external/search').query({ q: 'soup' });
    expect(res.status).toBe(503);
    expect(res.body.message).toMatch(/недоступен/);
  });
});
