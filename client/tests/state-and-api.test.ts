import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../src/api/HttpClient';
import { RecipeApi } from '../src/api/RecipeApi';
import { initialState, recipesReducer } from '../src/store/recipesReducer';
import { recipe } from './fixtures';

describe('recipesReducer', () => {
  it('сохраняет загруженный список', () => {
    const state = recipesReducer(initialState, { type: 'load/success', items: [recipe] });
    expect(state.status).toBe('success');
    expect(state.items).toHaveLength(1);
  });

  it('добавляет новый рецепт в начало и заменяет существующий', () => {
    let state = recipesReducer(initialState, { type: 'load/success', items: [recipe] });
    state = recipesReducer(state, { type: 'recipe/upsert', recipe: { ...recipe, id: 'r2' } });
    expect(state.items.map((r) => r.id)).toEqual(['r2', 'r1']);
    state = recipesReducer(state, { type: 'recipe/upsert', recipe: { ...recipe, title: 'Новое имя' } });
    expect(state.items[1].title).toBe('Новое имя');
  });

  it('удаляет рецепт и сбрасывает фильтры', () => {
    let state = recipesReducer(initialState, { type: 'load/success', items: [recipe] });
    state = recipesReducer(state, { type: 'filters/set', patch: { category: 'Супы' } });
    state = recipesReducer(state, { type: 'recipe/remove', id: 'r1' });
    expect(state.items).toEqual([]);
    expect(recipesReducer(state, { type: 'filters/reset' }).filters.category).toBe('');
  });

  it('увеличивает ревизию при внешнем изменении', () => {
    expect(recipesReducer(initialState, { type: 'remote/changed' }).revision).toBe(1);
  });
});

describe('RecipeApi (HttpClient)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('формирует строку запроса без пустых параметров и передаёт заголовки', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([recipe]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const api = new RecipeApi('/api', { 'X-Client-Id': 'test' });

    const result = await api.list({ search: 'блины', category: '', sort: 'title' });

    expect(result).toHaveLength(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/recipes?search=%D0%B1%D0%BB%D0%B8%D0%BD%D1%8B&sort=title');
    expect(init.headers['X-Client-Id']).toBe('test');
  });

  it('преобразует ответ 400 в ApiError с ошибками полей', async () => {
    const body = { message: 'Ошибка валидации', errors: [{ field: 'title', message: 'Слишком коротко' }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 400 })));
    const api = new RecipeApi('/api');

    const error = await api.create({} as never).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).fieldErrors[0].field).toBe('title');
  });

  it('сообщает о недоступности сервера при сетевой ошибке', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const error = (await new RecipeApi('/api').getById('x').catch((e: unknown) => e)) as ApiError;
    expect(error.isNetworkError).toBe(true);
    expect(error.message).toMatch(/недоступен/);
  });
});
