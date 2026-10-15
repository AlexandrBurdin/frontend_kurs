import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { Recipe } from '../models/Recipe.js';
import type { RecipeRepository } from '../repositories/RecipeRepository.js';
import type { EventBus } from '../services/EventBus.js';
import type { MealDbService } from '../services/MealDbService.js';

/**
 * Прокси к внешнему API TheMealDB.
 * Клиент обращается только к собственному серверу: это скрывает
 * детали внешнего API, позволяет кэшировать ответы и единообразно обрабатывать ошибки.
 */
export function externalRouter(service: MealDbService, repo: RecipeRepository, bus: EventBus): Router {
  const router = Router();

  // GET /api/external/search?q=pancakes
  router.get('/search', async (req, res, next) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      if (q.length < 2) return res.status(400).json({ message: 'Введите не менее 2 символов' });
      const previews = await service.search(q);
      const imported = new Set((await repo.findAll()).map((r) => r.externalId).filter(Boolean));
      res.json(previews.map((p) => ({ ...p, imported: imported.has(p.externalId) })));
    } catch (err) {
      next(err);
    }
  });

  router.get('/random', async (_req, res, next) => {
    try {
      const preview = await service.random();
      if (!preview) return res.status(404).json({ message: 'Рецепт не найден' });
      res.json(preview);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/external/import/:externalId — сохранить рецепт из внешнего API в свою книгу
  router.post('/import/:externalId', async (req, res, next) => {
    try {
      const existing = await repo.findByExternalId(req.params.externalId);
      if (existing) return res.status(200).json(existing);

      const input = await service.getById(req.params.externalId);
      if (!input) return res.status(404).json({ message: 'Рецепт во внешнем источнике не найден' });

      const now = new Date().toISOString();
      const recipe: Recipe = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
      await repo.create(recipe);
      bus.publish({ type: 'recipe:created', payload: recipe, origin: req.header('X-Client-Id') });
      res.status(201).json(recipe);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
