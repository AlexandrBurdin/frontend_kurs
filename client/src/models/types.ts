export type Difficulty = 'easy' | 'medium' | 'hard';
export type RecipeSource = 'user' | 'themealdb';

export interface Ingredient {
  name: string;
  amount: number | null;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  cuisine: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: Difficulty;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  imageUrl: string | null;
  source: RecipeSource;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export type RecipeSort = 'new' | 'title' | 'time';

export interface RecipeFilters {
  search: string;
  category: string;
  difficulty: '' | Difficulty;
  maxTime: string;
  sort: RecipeSort;
}

export interface ExternalRecipePreview {
  externalId: string;
  title: string;
  category: string;
  cuisine: string;
  imageUrl: string | null;
  tags: string[];
  ingredientsCount: number;
  imported: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}

export const CATEGORIES = [
  'Завтраки',
  'Супы',
  'Основные блюда',
  'Салаты',
  'Выпечка',
  'Десерты',
  'Напитки',
  'Закуски',
] as const;

export const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'ст. л.', 'ч. л.', 'стакан', 'щепотка', 'по вкусу'] as const;
