import type { FieldError, RecipeInput } from './types';

type Rule<T> = (value: T) => FieldError | FieldError[] | null;

/**
 * Базовый класс валидатора. Наследники описывают набор правил,
 * а общий алгоритм их применения задан здесь (шаблонный метод).
 */
export abstract class Validator<T> {
  protected abstract rules(): Rule<T>[];

  validate(value: T): FieldError[] {
    return this.rules().flatMap((rule) => {
      const result = rule(value);
      if (!result) return [];
      return Array.isArray(result) ? result : [result];
    });
  }

  isValid(value: T): boolean {
    return this.validate(value).length === 0;
  }
}

/** Клиентская проверка формы рецепта (дублирует ключевые серверные правила для мгновенной обратной связи). */
export class RecipeFormValidator extends Validator<RecipeInput> {
  protected rules(): Rule<RecipeInput>[] {
    return [
      (r) => (r.title.trim().length < 3 ? { field: 'title', message: 'Название — не менее 3 символов' } : null),
      (r) => (!r.category ? { field: 'category', message: 'Выберите категорию' } : null),
      (r) =>
        !Number.isInteger(r.servings) || r.servings < 1 || r.servings > 50
          ? { field: 'servings', message: 'Порций: от 1 до 50' }
          : null,
      (r) =>
        r.prepTime < 0 || r.cookTime < 0 ? { field: 'cookTime', message: 'Время не может быть отрицательным' } : null,
      (r) =>
        r.ingredients.length === 0
          ? { field: 'ingredients', message: 'Добавьте хотя бы один ингредиент' }
          : r.ingredients.flatMap((ing, i) => {
              const errors: FieldError[] = [];
              if (!ing.name.trim()) {
                errors.push({ field: `ingredients[${i}].name`, message: `Ингредиент №${i + 1}: укажите название` });
              }
              if (ing.amount !== null && !(ing.amount > 0)) {
                errors.push({
                  field: `ingredients[${i}].amount`,
                  message: `Ингредиент №${i + 1}: количество должно быть больше нуля`,
                });
              }
              return errors;
            }),
      (r) =>
        r.steps.filter((s) => s.trim()).length === 0 ? { field: 'steps', message: 'Опишите хотя бы один шаг' } : null,
      (r) =>
        r.imageUrl && !/^https?:\/\//i.test(r.imageUrl)
          ? { field: 'imageUrl', message: 'Ссылка должна начинаться с http:// или https://' }
          : null,
    ];
  }
}
