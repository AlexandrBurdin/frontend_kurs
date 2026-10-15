import { Router, type Request } from 'express';
import { randomUUID } from 'node:crypto';
import { RecipeValidator, type Recipe } from '../models/Recipe.js';
import type { RecipeRepository, RecipeSort } from '../repositories/RecipeRepository.js';
import type { EventBus } from '../services/EventBus.js';

const clientId = (req: Request): string | undefined => req.header('X-Client-Id') ?? undefined;

export function recipesRouter(repo: RecipeRepository, bus: EventBus): Router {
  const router = Router();
  const validator = new RecipeValidator();

  // GET /api/recipes?search=&category=&difficulty=&maxTime=&sort=
  router.get('/', async (req, res, next) => {
    try {
      const { search, category, difficulty, maxTime, sort } = req.query;
      const recipes = await repo.query({
        search: typeof search === 'string' ? search : undefined,
        category: typeof category === 'string' && category ? category : undefined,
        difficulty: typeof difficulty === 'string' && difficulty ? difficulty : undefined,
        maxTime: typeof maxTime === 'string' && maxTime ? Number(maxTime) : undefined,
        sort: (['new', 'title', 'time'] as const).includes(sort as RecipeSort) ? (sort as RecipeSort) : undefined,
      });
      res.json(recipes);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const recipe = await repo.findById(req.params.id);
      if (!recipe) return res.status(404).json({ message: 'Рецепт не найден' });
      res.json(recipe);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const { value, errors } = validator.validate(req.body);
      if (!value) return res.status(400).json({ message: 'Ошибка валидации', errors });
      const now = new Date().toISOString();
      const recipe: Recipe = { ...value, id: randomUUID(), createdAt: now, updatedAt: now };
      await repo.create(recipe);
      bus.publish({ type: 'recipe:created', payload: recipe, origin: clientId(req) });
      res.status(201).json(recipe);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const { value, errors } = validator.validate(req.body);
      if (!value) return res.status(400).json({ message: 'Ошибка валидации', errors });
      const updated = await repo.update(req.params.id, {
        ...value,
        updatedAt: new Date().toISOString(),
      });
      if (!updated) return res.status(404).json({ message: 'Рецепт не найден' });
      bus.publish({ type: 'recipe:updated', payload: updated, origin: clientId(req) });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const removed = await repo.delete(req.params.id);
      if (!removed) return res.status(404).json({ message: 'Рецепт не найден' });
      bus.publish({ type: 'recipe:deleted', payload: { id: req.params.id }, origin: clientId(req) });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
