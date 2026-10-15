import type { Recipe } from '../src/models/types';

export const recipe: Recipe = {
  id: 'r1',
  title: 'Блины на молоке',
  description: 'Тонкие блины',
  category: 'Выпечка',
  cuisine: 'Русская',
  servings: 4,
  prepTime: 10,
  cookTime: 70,
  difficulty: 'easy',
  ingredients: [
    { name: 'Молоко', amount: 500, unit: 'мл' },
    { name: 'Яйцо', amount: 2, unit: 'шт' },
    { name: 'Соль', amount: null, unit: 'по вкусу' },
  ],
  steps: ['Смешать', 'Жарить'],
  tags: ['блины'],
  imageUrl: null,
  source: 'user',
  externalId: null,
  createdAt: '2026-09-01T09:00:00.000Z',
  updatedAt: '2026-09-01T09:00:00.000Z',
};
