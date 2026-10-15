import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { FilterBar } from '../src/blocks/filter-bar/FilterBar';
import { IngredientList } from '../src/blocks/ingredient-list/IngredientList';
import { RecipeCard } from '../src/blocks/recipe-card/RecipeCard';
import { RecipeForm } from '../src/blocks/recipe-form/RecipeForm';
import { ServingsControl } from '../src/blocks/servings-control/ServingsControl';
import { StepList } from '../src/blocks/step-list/StepList';
import { RecipeModel } from '../src/models/RecipeModel';
import { defaultFilters } from '../src/store/recipesReducer';
import { recipe } from './fixtures';

describe('RecipeCard', () => {
  it('показывает основные сведения и ссылку на рецепт', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RecipeCard recipe={recipe} favorite={false} onToggleFavorite={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Блины на молоке' })).toBeInTheDocument();
    expect(screen.getByText('⏱ 1 ч 20 мин')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/recipes/r1');
  });

  it('вызывает переключение избранного', async () => {
    const onToggle = vi.fn();
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RecipeCard recipe={recipe} favorite={false} onToggleFavorite={onToggle} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Добавить в избранное' }));
    expect(onToggle).toHaveBeenCalledWith('r1');
  });
});

describe('ServingsControl + IngredientList', () => {
  it('пересчитывает количество ингредиентов при изменении порций', async () => {
    const model = new RecipeModel(recipe);
    function Harness() {
      const [servings, setServings] = React.useState(4);
      return (
        <>
          <ServingsControl value={servings} onChange={setServings} />
          <IngredientList ingredients={model.scaleIngredients(servings)} />
        </>
      );
    }
    render(<Harness />);
    expect(screen.getAllByTestId('ingredient-amount')[0]).toHaveTextContent('500 мл');
    await userEvent.click(screen.getByRole('button', { name: 'Уменьшить количество порций' }));
    await userEvent.click(screen.getByRole('button', { name: 'Уменьшить количество порций' }));
    expect(screen.getByText('порции', { exact: false })).toHaveTextContent('2 порции');
    expect(screen.getAllByTestId('ingredient-amount')[0]).toHaveTextContent('250 мл');
    expect(screen.getAllByTestId('ingredient-amount')[1]).toHaveTextContent('1 шт');
  });

  it('не даёт уменьшить порции ниже одной', () => {
    render(<ServingsControl value={1} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Уменьшить количество порций' })).toBeDisabled();
  });
});

describe('StepList', () => {
  it('отмечает шаги выполненными по порядку', async () => {
    render(<StepList steps={['Первый', 'Второй', 'Третий']} />);
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[1]);
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('FilterBar', () => {
  it('передаёт изменения поиска и категории', async () => {
    const onChange = vi.fn();
    render(<FilterBar filters={defaultFilters} total={8} onChange={onChange} onReset={() => {}} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Поиск рецептов' }), 'б');
    expect(onChange).toHaveBeenCalledWith({ search: 'б' });
    await userEvent.click(within(screen.getByRole('group', { name: 'Категории' })).getByText('Супы'));
    expect(onChange).toHaveBeenCalledWith({ category: 'Супы' });
    expect(screen.getByText('8')).toBeInTheDocument();
  });
});

describe('RecipeForm', () => {
  it('показывает ошибки валидации и не отправляет пустую форму', async () => {
    const onSubmit = vi.fn();
    render(<RecipeForm submitLabel="Добавить рецепт" onSubmit={onSubmit} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Добавить рецепт' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Название — не менее 3 символов')).toBeInTheDocument();
    expect(screen.getByText('Выберите категорию')).toBeInTheDocument();
    expect(screen.getByText('Опишите хотя бы один шаг')).toBeInTheDocument();
  });

  it('собирает данные формы, включая динамически добавленные ингредиенты', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RecipeForm submitLabel="Добавить рецепт" onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByPlaceholderText('Например, Сырники из творога'), 'Омлет');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Категория *' }), 'Завтраки');
    await user.type(screen.getByRole('textbox', { name: 'Ингредиент 1' }), 'Яйцо');
    await user.type(screen.getByRole('textbox', { name: 'Количество 1' }), '3');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Единица измерения 1' }), 'шт');
    await user.click(screen.getByRole('button', { name: '+ Добавить ингредиент' }));
    await user.type(screen.getByRole('textbox', { name: 'Ингредиент 2' }), 'Соль');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Единица измерения 2' }), 'по вкусу');
    await user.type(screen.getByRole('textbox', { name: 'Шаг 1' }), 'Взбить и пожарить');
    await user.type(screen.getByPlaceholderText('быстро, вегетарианское'), 'быстро, яйца');
    await user.click(screen.getByRole('button', { name: 'Добавить рецепт' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      title: 'Омлет',
      category: 'Завтраки',
      ingredients: [
        { name: 'Яйцо', amount: 3, unit: 'шт' },
        { name: 'Соль', amount: null, unit: 'по вкусу' },
      ],
      steps: ['Взбить и пожарить'],
      tags: ['быстро', 'яйца'],
      source: 'user',
    });
  });
});
