import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { RecipeRepository } from './repositories/RecipeRepository.js';
import { EventBus } from './services/EventBus.js';
import { MealDbService } from './services/MealDbService.js';
import { seedRecipes } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4000);
const DATA_FILE = process.env.DATA_FILE ?? path.resolve(here, '../data/recipes.json');
const MEALDB_URL = process.env.MEALDB_URL ?? 'https://www.themealdb.com/api/json/v1/1';
const STATIC_DIR = process.env.STATIC_DIR ?? path.resolve(here, '../../client/dist');

const app = createApp({
  repo: new RecipeRepository(DATA_FILE, seedRecipes()),
  bus: new EventBus(),
  mealDb: new MealDbService(MEALDB_URL),
  staticDir: STATIC_DIR,
});

app.listen(PORT, () => {
  console.log(`Сервер «Книга рецептов» запущен: http://localhost:${PORT}`);
});
