# Книга рецептов

Веб-приложение для составления кулинарных рецептов. Курсовая работа по дисциплине «Фронтенд-разработка».

**Стек:** HTML5, CSS3 (БЭМ), TypeScript, React 18, React Router, Vite — клиент; Node.js, Express, TypeScript — сервер;
Vitest, Testing Library, Supertest, Playwright — тестирование; ESLint, Prettier — качество кода.

## Возможности

- каталог рецептов с поиском (по названию, ингредиенту, тегу), фильтрами по категории, сложности и времени, сортировкой;
- создание и редактирование рецепта: динамические списки ингредиентов и шагов, валидация на клиенте и сервере;
- страница рецепта: пересчёт ингредиентов на любое число порций, пошаговый «режим готовки»;
- избранное и список покупок с объединением одинаковых продуктов (хранятся в `localStorage`);
- поиск и импорт рецептов из внешнего API [TheMealDB](https://www.themealdb.com/api.php);
- обновления в реальном времени через Server-Sent Events: изменения в одной вкладке сразу видны в других;
- адаптивная вёрстка (телефон, планшет, компьютер), анимации и переходы.

## Запуск

Требуется Node.js 20 или новее.

```bash
npm install          # установка зависимостей обеих частей (npm workspaces)
npm run dev          # сервер на :4000 и клиент Vite на :5173 (откройте http://localhost:5173)
```

Сборка и запуск в режиме production (сервер раздаёт собранный клиент):

```bash
npm run build
npm start            # http://localhost:4000
```

Переменные окружения сервера: `PORT` (4000), `DATA_FILE` (server/data/recipes.json),
`MEALDB_URL` (https://www.themealdb.com/api/json/v1/1), `STATIC_DIR` (client/dist).

## Тесты и проверки

```bash
npm test             # модульные и интеграционные тесты сервера и клиента (Vitest)
npm run build && npm run test:e2e   # сквозные тесты Playwright (используют локальную заглушку TheMealDB)
npm run lint         # ESLint
npm run format       # Prettier
```

## Структура

```
recipe-book/
├── client/                React-приложение
│   ├── src/api/           HttpClient и API-клиенты
│   ├── src/blocks/        БЭМ-блоки: компонент + стили
│   ├── src/hooks/         пользовательские хуки
│   ├── src/models/        типы, модели, валидаторы
│   ├── src/pages/         страницы (маршруты)
│   ├── src/store/         контексты и редьюсер состояния
│   ├── src/styles/        переменные, базовые стили, анимации
│   └── tests/             модульные тесты
├── server/                REST API на Express
│   ├── src/models/        модель рецепта и валидатор
│   ├── src/repositories/  хранилище (иерархия репозиториев)
│   ├── src/routes/        маршруты API
│   ├── src/services/      TheMealDB, шина событий SSE
│   └── tests/             модульные и интеграционные тесты
└── e2e/                   сквозные тесты и заглушка внешнего API
```

## REST API

| Метод  | Путь                                                      | Назначение        |
| ------ | --------------------------------------------------------- | ----------------- |
| GET    | /api/recipes?search=&category=&difficulty=&maxTime=&sort= | список рецептов   |
| GET    | /api/recipes/:id                                          | рецепт            |
| POST   | /api/recipes                                              | создание          |
| PUT    | /api/recipes/:id                                          | изменение         |
| DELETE | /api/recipes/:id                                          | удаление          |
| GET    | /api/external/search?q=                                   | поиск в TheMealDB |
| POST   | /api/external/import/:externalId                          | импорт рецепта    |
| GET    | /api/events                                               | поток событий SSE |
