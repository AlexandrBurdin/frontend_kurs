import { describe, expect, it } from 'vitest';
import { RecipeModel } from '../src/models/RecipeModel';
import { ShoppingList } from '../src/models/ShoppingList';
import { RecipeFormValidator } from '../src/models/validators';
import { recipe } from './fixtures';

describe('RecipeModel', () => {
  const model = new RecipeModel(recipe);

  it('вычисляет общее время и форматирует его', () => {
    expect(model.totalTime).toBe(80);
    expect(model.formattedTime).toBe('1 ч 20 мин');
    expect(RecipeModel.formatMinutes(45)).toBe('45 мин');
    expect(RecipeModel.formatMinutes(120)).toBe('2 ч');
  });

  it('пересчитывает ингредиенты на другое число порций', () => {
    const scaled = model.scaleIngredients(2);
    expect(scaled[0].amount).toBe(250);
    expect(scaled[1].amount).toBe(1);
    expect(scaled[2].amount).toBeNull();
  });

  it('не изменяет исходный рецепт при пересчёте', () => {
    model.scaleIngredients(10);
    expect(recipe.ingredients[0].amount).toBe(500);
  });

  it.each([
    [0.5, '½'],
    [1.5, '1½'],
    [0.25, '¼'],
    [2, '2'],
    [1.2, '1,2'],
    [null, ''],
  ])('форматирует количество %s как «%s»', (amount, expected) => {
    expect(RecipeModel.formatAmount(amount)).toBe(expected);
  });

  it('склоняет слово «порция»', () => {
    const forms: [string, string, string] = ['порция', 'порции', 'порций'];
    expect(RecipeModel.plural(1, forms)).toBe('порция');
    expect(RecipeModel.plural(3, forms)).toBe('порции');
    expect(RecipeModel.plural(5, forms)).toBe('порций');
    expect(RecipeModel.plural(11, forms)).toBe('порций');
    expect(RecipeModel.plural(21, forms)).toBe('порция');
  });

  it('возвращает подпись сложности и модификатор категории', () => {
    expect(model.difficultyLabel).toBe('Легко');
    expect(model.categorySlug).toBe('bakery');
  });
});

describe('ShoppingList', () => {
  it('объединяет одинаковые ингредиенты из разных рецептов', () => {
    const list = ShoppingList.empty()
      .addIngredients('Блины', [{ name: 'Молоко', amount: 500, unit: 'мл' }])
      .addIngredients('Сырники', [
        { name: 'молоко', amount: 100, unit: 'мл' },
        { name: 'Творог', amount: 400, unit: 'г' },
      ]);
    expect(list.size).toBe(2);
    expect(list.items[0]).toMatchObject({ amount: 600, recipes: ['Блины', 'Сырники'] });
  });

  it('отмечает купленное и удаляет отмеченные позиции', () => {
    let list = ShoppingList.empty().addIngredients('Борщ', [
      { name: 'Свёкла', amount: 2, unit: 'шт' },
      { name: 'Капуста', amount: 300, unit: 'г' },
    ]);
    list = list.toggle(ShoppingList.keyOf('Свёкла', 'шт'));
    expect(list.remaining).toBe(1);
    expect(list.clearChecked().size).toBe(1);
  });

  it('сериализуется и восстанавливается из JSON', () => {
    const list = ShoppingList.empty().addIngredients('Салат', [{ name: 'Огурец', amount: 1, unit: 'шт' }]);
    expect(ShoppingList.fromJSON(list.toJSON()).items).toEqual(list.items);
    expect(ShoppingList.fromJSON('{битый json').size).toBe(0);
  });
});

describe('RecipeFormValidator', () => {
  const validator = new RecipeFormValidator();
  const { id: _id, createdAt: _c, updatedAt: _u, ...input } = recipe;

  it('принимает корректные данные', () => {
    expect(validator.isValid(input)).toBe(true);
  });

  it('находит ошибки в названии, ингредиентах и ссылке', () => {
    const errors = validator.validate({
      ...input,
      title: 'Ы',
      ingredients: [{ name: '', amount: 0, unit: 'г' }],
      imageUrl: 'ftp://example.com/a.png',
    });
    expect(errors.map((e) => e.field)).toEqual(['title', 'ingredients[0].name', 'ingredients[0].amount', 'imageUrl']);
  });
});
