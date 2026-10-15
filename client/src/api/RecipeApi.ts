import { HttpClient } from './HttpClient';
import type { ExternalRecipePreview, Recipe, RecipeFilters, RecipeInput } from '../models/types';

/** Клиент REST API собственных рецептов. */
export class RecipeApi extends HttpClient {
  list(filters: Partial<RecipeFilters> = {}): Promise<Recipe[]> {
    return this.get<Recipe[]>('/recipes', { ...filters });
  }

  getById(id: string): Promise<Recipe> {
    return this.get<Recipe>(`/recipes/${encodeURIComponent(id)}`);
  }

  create(input: RecipeInput): Promise<Recipe> {
    return this.post<Recipe>('/recipes', input);
  }

  update(id: string, input: RecipeInput): Promise<Recipe> {
    return this.put<Recipe>(`/recipes/${encodeURIComponent(id)}`, input);
  }

  remove(id: string): Promise<void> {
    return this.delete(`/recipes/${encodeURIComponent(id)}`);
  }
}

/** Клиент внешнего каталога рецептов (TheMealDB через прокси сервера). */
export class ExternalRecipeApi extends HttpClient {
  search(query: string): Promise<ExternalRecipePreview[]> {
    return this.get<ExternalRecipePreview[]>('/external/search', { q: query });
  }

  random(): Promise<ExternalRecipePreview> {
    return this.get<ExternalRecipePreview>('/external/random');
  }

  importRecipe(externalId: string): Promise<Recipe> {
    return this.post<Recipe>(`/external/import/${encodeURIComponent(externalId)}`);
  }
}
