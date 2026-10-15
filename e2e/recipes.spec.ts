import { expect, test } from '@playwright/test';

test.describe('Каталог рецептов', () => {
  test('отображает рецепты и фильтрует их', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ваша личная книга рецептов' })).toBeVisible();
    await expect(page.getByTestId('recipe-card')).toHaveCount(8);

    await page.getByRole('searchbox', { name: 'Поиск рецептов' }).fill('фета');
    await expect(page.getByTestId('recipe-card')).toHaveCount(1);
    await expect(page.getByTestId('recipe-card')).toContainText('Греческий салат');

    await page.getByRole('button', { name: 'Сбросить' }).click();
    await page.getByRole('group', { name: 'Категории' }).getByRole('button', { name: 'Супы' }).click();
    await expect(page.getByTestId('recipe-card')).toHaveCount(1);
    await expect(page.getByTestId('recipe-card')).toContainText('Борщ');
  });

  test('пересчитывает ингредиенты по числу порций', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'Сырники из творога' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Сырники из творога' })).toBeVisible();
    const firstAmount = page.getByTestId('ingredient-amount').first();
    await expect(firstAmount).toHaveText('400 г');
    await page.getByRole('button', { name: 'Увеличить количество порций' }).click();
    await expect(firstAmount).toHaveText('600 г');
  });
});

test.describe('Создание, редактирование и удаление', () => {
  test('полный жизненный цикл рецепта', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.getByRole('button', { name: 'Добавить рецепт' }).click();
    await expect(page.getByText('Название — не менее 3 символов')).toBeVisible();

    await page.getByPlaceholder('Например, Сырники из творога').fill('Овсяная каша с ягодами');
    await page.getByRole('combobox', { name: 'Категория *' }).selectOption('Завтраки');
    await page.getByRole('textbox', { name: 'Ингредиент 1' }).fill('Овсяные хлопья');
    await page.getByRole('textbox', { name: 'Количество 1' }).fill('80');
    await page.getByRole('button', { name: '+ Добавить ингредиент' }).click();
    await page.getByRole('textbox', { name: 'Ингредиент 2' }).fill('Молоко');
    await page.getByRole('textbox', { name: 'Количество 2' }).fill('250');
    await page.getByRole('combobox', { name: 'Единица измерения 2' }).selectOption('мл');
    await page.getByRole('textbox', { name: 'Шаг 1' }).fill('Доведите молоко до кипения и всыпьте хлопья.');
    await page.getByRole('button', { name: '+ Добавить шаг' }).click();
    await page.getByRole('textbox', { name: 'Шаг 2' }).fill('Варите 5 минут, подавайте с ягодами.');
    await page.getByRole('button', { name: 'Добавить рецепт' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Овсяная каша с ягодами' })).toBeVisible();
    await expect(page.getByText('Рецепт добавлен в книгу')).toBeVisible();

    await page.getByRole('link', { name: 'Изменить' }).click();
    await page.getByPlaceholder('Например, Сырники из творога').fill('Овсяная каша с малиной');
    await page.getByRole('button', { name: 'Сохранить изменения' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Овсяная каша с малиной' })).toBeVisible();

    await page.getByRole('button', { name: 'Удалить' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Удалить' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Рецепт «Овсяная каша с малиной» удалён')).toBeVisible();
    await expect(page.getByTestId('recipe-card').filter({ hasText: 'Овсяная каша' })).toHaveCount(0);
  });
});

test.describe('Интеграция с внешним API', () => {
  test('находит рецепт в TheMealDB и сохраняет его в книгу', async ({ page }) => {
    await page.goto('/import');
    await page.getByRole('searchbox', { name: 'Поисковый запрос' }).fill('pancakes');
    await page.getByRole('button', { name: 'Найти' }).click();
    await expect(page.getByTestId('external-card')).toHaveCount(3);

    const card = page.getByTestId('external-card').filter({ hasText: 'Banana Pancakes' });
    await card.getByRole('button', { name: 'Сохранить в книгу' }).click();
    await expect(card.getByText('✓ В вашей книге')).toBeVisible();

    await page.getByRole('link', { name: 'Рецепты', exact: true }).click();
    await page.getByRole('heading', { name: 'Banana Pancakes' }).click();
    await expect(page.getByText('TheMealDB', { exact: true })).toBeVisible();
    await expect(page.getByText('Mash the bananas in a bowl until smooth.')).toBeVisible();
  });
});

test.describe('Обновления в реальном времени', () => {
  test('вторая вкладка получает уведомление о новом рецепте', async ({ browser }) => {
    const observer = await browser.newPage();
    const author = await browser.newPage();
    await observer.goto('/');
    await expect(observer.locator('.header__status--open')).toBeVisible();

    const response = await author.request.post('/api/recipes', {
      data: {
        title: 'Чай с имбирём',
        description: '',
        category: 'Напитки',
        cuisine: '',
        servings: 2,
        prepTime: 5,
        cookTime: 5,
        difficulty: 'easy',
        ingredients: [{ name: 'Имбирь', amount: 20, unit: 'г' }],
        steps: ['Залейте имбирь кипятком'],
        tags: [],
        imageUrl: null,
      },
    });
    expect(response.status()).toBe(201);

    await expect(observer.getByText('Добавлен новый рецепт: «Чай с имбирём»')).toBeVisible();
    await expect(observer.getByTestId('recipe-card').filter({ hasText: 'Чай с имбирём' })).toBeVisible();
  });
});

test.describe('Список покупок и избранное', () => {
  test('добавляет ингредиенты и объединяет одинаковые продукты', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'Сырники из творога' }).click();
    await page.getByRole('button', { name: 'В список покупок' }).click();
    await page.goto('/');
    await page.getByRole('heading', { name: 'Тонкие блины на молоке' }).click();
    await page.getByRole('button', { name: 'В список покупок' }).click();

    await page.getByRole('link', { name: /Покупки/ }).click();
    const sugar = page
      .locator('.shopping-list__item')
      .filter({ has: page.locator('.shopping-list__name', { hasText: /^Сахар$/ }) });
    await expect(sugar).toContainText('3 ст. л.');
    await expect(sugar).toContainText('Сырники из творога, Тонкие блины на молоке');
  });

  test('сохраняет избранное после перезагрузки', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('recipe-card').filter({ hasText: 'Морс клюквенный' });
    await card.getByRole('button', { name: 'Добавить в избранное' }).click();
    await page.reload();
    await page.getByRole('link', { name: /Избранное/ }).click();
    await expect(page.getByTestId('recipe-card')).toHaveCount(1);
  });
});

test.describe('Адаптивность @mobile', () => {
  test('на телефоне навигация открывается через меню @mobile', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Основная навигация' });
    await expect(nav).toBeHidden();
    await page.getByRole('button', { name: 'Меню' }).click();
    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: 'Покупки' }).click();
    await expect(page.getByRole('heading', { name: 'Список покупок', exact: true })).toBeVisible();
  });
});
