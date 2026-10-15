import { describe, expect, it } from 'vitest';
import { RecipeValidator } from '../src/models/Recipe.js';
import { validRecipe } from './helpers.js';

describe('RecipeValidator', () => {
  const validator = new RecipeValidator();

  it('принимает корректный рецепт и нормализует теги', () => {
    const { value, errors } = validator.validate(validRecipe);
    expect(errors).toEqual([]);
    expect(value?.tags).toEqual(['быстро', 'яйца']);
    expect(value?.imageUrl).toBeNull();
    expect(value?.source).toBe('user');
  });

  it('возвращает ошибки для пустых обязательных полей', () => {
    const { value, errors } = validator.validate({ ...validRecipe, title: 'ab', ingredients: [], steps: [] });
    expect(value).toBeNull();
    expect(errors.map((e) => e.field)).toEqual(expect.arrayContaining(['title', 'ingredients', 'steps']));
  });

  it('проверяет числовые диапазоны и сложность', () => {
    const { errors } = validator.validate({ ...validRecipe, servings: 0, cookTime: -5, difficulty: 'expert' });
    expect(errors.map((e) => e.field)).toEqual(['servings', 'cookTime', 'difficulty']);
  });

  it('отклоняет отрицательное количество ингредиента и небезопасную ссылку', () => {
    const { errors } = validator.validate({
      ...validRecipe,
      ingredients: [{ name: 'Мука', amount: -1, unit: 'г' }],
      imageUrl: 'javascript:alert(1)',
    });
    expect(errors.map((e) => e.field)).toEqual(['ingredients[0].amount', 'imageUrl']);
  });

  it('не принимает тело запроса, не являющееся объектом', () => {
    expect(validator.validate(null).errors[0].field).toBe('body');
  });
});
