import { JsonFileRepository } from './JsonFileRepository.js';
import type { Recipe } from '../models/Recipe.js';

export type RecipeSort = 'new' | 'title' | 'time';

export interface RecipeQuery {
  search?: string;
  category?: string;
  difficulty?: string;
  maxTime?: number;
  sort?: RecipeSort;
}

/**
 * Репозиторий рецептов: расширяет файловое хранилище
 * предметно-ориентированными операциями поиска и фильтрации.
 */
export class RecipeRepository extends JsonFileRepository<Recipe> {
  async query(q: RecipeQuery): Promise<Recipe[]> {
    let result = await this.findAll();

    if (q.search) {
      const needle = q.search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(needle) ||
          r.description.toLowerCase().includes(needle) ||
          r.tags.some((t) => t.includes(needle)) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(needle)),
      );
    }
    if (q.category) result = result.filter((r) => r.category === q.category);
    if (q.difficulty) result = result.filter((r) => r.difficulty === q.difficulty);
    if (q.maxTime !== undefined && Number.isFinite(q.maxTime)) {
      result = result.filter((r) => r.prepTime + r.cookTime <= (q.maxTime as number));
    }

    const sorters: Record<RecipeSort, (a: Recipe, b: Recipe) => number> = {
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
      title: (a, b) => a.title.localeCompare(b.title, 'ru'),
      time: (a, b) => a.prepTime + a.cookTime - (b.prepTime + b.cookTime),
    };
    return result.sort(sorters[q.sort ?? 'new']);
  }

  async findByExternalId(externalId: string): Promise<Recipe | undefined> {
    return (await this.findAll()).find((r) => r.externalId === externalId);
  }
}
