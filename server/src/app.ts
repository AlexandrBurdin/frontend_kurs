import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { recipesRouter } from './routes/recipes.js';
import { externalRouter } from './routes/external.js';
import { RecipeRepository } from './repositories/RecipeRepository.js';
import { EventBus } from './services/EventBus.js';
import { ExternalApiError, MealDbService } from './services/MealDbService.js';
import { CATEGORIES, UNITS } from './models/Recipe.js';

export interface AppDeps {
  repo: RecipeRepository;
  bus?: EventBus;
  mealDb?: MealDbService;
  /** Каталог собранного клиента (client/dist) для раздачи в production */
  staticDir?: string;
}

export function createApp({ repo, bus = new EventBus(), mealDb = new MealDbService(), staticDir }: AppDeps) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '200kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', clients: bus.size }));
  app.get('/api/meta', (_req, res) => res.json({ categories: CATEGORIES, units: UNITS }));
  app.get('/api/events', (_req, res) => bus.subscribe(res));
  app.use('/api/recipes', recipesRouter(repo, bus));
  app.use('/api/external', externalRouter(mealDb, repo, bus));

  app.use('/api', (_req, res) => res.status(404).json({ message: 'Маршрут API не найден' }));

  // В production сервер раздает собранный SPA и возвращает index.html для клиентских маршрутов
  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir, { maxAge: '7d', index: false }));
    app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  // Централизованный обработчик ошибок
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ExternalApiError) {
      return res.status(err.status).json({ message: err.message });
    }
    if (err instanceof SyntaxError) {
      return res.status(400).json({ message: 'Некорректный JSON в теле запроса' });
    }
    console.error(err);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  });

  return app;
}
