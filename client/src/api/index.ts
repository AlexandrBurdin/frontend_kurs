import { ExternalRecipeApi, RecipeApi } from './RecipeApi';

/**
 * Уникальный идентификатор вкладки. Передаётся серверу в заголовке X-Client-Id,
 * чтобы вкладка не показывала уведомление о собственных изменениях.
 */
export const CLIENT_ID =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

const API_BASE = '/api';
const headers = { 'X-Client-Id': CLIENT_ID };

export const recipeApi = new RecipeApi(API_BASE, headers);
export const externalApi = new ExternalRecipeApi(API_BASE, headers);
export const EVENTS_URL = `${API_BASE}/events`;

export { ApiError } from './HttpClient';
