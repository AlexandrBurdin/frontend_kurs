import { useMemo, useState, type FormEvent } from 'react';
import { RecipeFormValidator } from '../../models/validators';
import { CATEGORIES, UNITS, type FieldError, type Recipe, type RecipeInput } from '../../models/types';
import { Button } from '../button/Button';
import { RecipeCover } from '../recipe-cover/RecipeCover';
import './recipe-form.css';

interface IngredientRow {
  key: number;
  name: string;
  amount: string;
  unit: string;
}

interface Draft {
  title: string;
  description: string;
  category: string;
  cuisine: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  difficulty: RecipeInput['difficulty'];
  ingredients: IngredientRow[];
  steps: string[];
  tags: string;
  imageUrl: string;
}

interface Props {
  initial?: Recipe;
  submitLabel: string;
  serverErrors?: FieldError[];
  onSubmit: (input: RecipeInput) => Promise<void>;
  onCancel: () => void;
}

let rowKey = 0;
const newRow = (name = '', amount = '', unit = 'г'): IngredientRow => ({ key: ++rowKey, name, amount, unit });

function toDraft(recipe?: Recipe): Draft {
  return {
    title: recipe?.title ?? '',
    description: recipe?.description ?? '',
    category: recipe?.category ?? '',
    cuisine: recipe?.cuisine ?? '',
    servings: String(recipe?.servings ?? 2),
    prepTime: String(recipe?.prepTime ?? 10),
    cookTime: String(recipe?.cookTime ?? 20),
    difficulty: recipe?.difficulty ?? 'easy',
    ingredients: recipe?.ingredients.map((i) => newRow(i.name, i.amount === null ? '' : String(i.amount), i.unit)) ?? [
      newRow(),
    ],
    steps: recipe?.steps.length ? [...recipe.steps] : [''],
    tags: recipe?.tags.join(', ') ?? '',
    imageUrl: recipe?.imageUrl ?? '',
  };
}

/** Преобразует черновик формы (строковые значения полей) во входные данные API. */
export function draftToInput(draft: Draft, source?: Recipe): RecipeInput {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    cuisine: draft.cuisine.trim(),
    servings: Number(draft.servings),
    prepTime: Number(draft.prepTime || 0),
    cookTime: Number(draft.cookTime || 0),
    difficulty: draft.difficulty,
    ingredients: draft.ingredients
      .filter((r) => r.name.trim() || r.amount.trim())
      .map((r) => ({
        name: r.name.trim(),
        amount: r.amount.trim() === '' ? null : Number(r.amount.replace(',', '.')),
        unit: r.unit,
      })),
    steps: draft.steps.map((s) => s.trim()).filter(Boolean),
    tags: draft.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    imageUrl: draft.imageUrl.trim() || null,
    source: source?.source ?? 'user',
    externalId: source?.externalId ?? null,
  };
}

const validator = new RecipeFormValidator();

/** Форма создания и редактирования рецепта с динамическими списками ингредиентов и шагов. */
export function RecipeForm({ initial, submitLabel, serverErrors = [], onSubmit, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const allErrors = useMemo(() => [...errors, ...serverErrors], [errors, serverErrors]);
  const errorFor = (field: string) => allErrors.find((e) => e.field === field)?.message;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const updateRow = (key: number, patch: Partial<IngredientRow>) =>
    set(
      'ingredients',
      draft.ingredients.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );

  const moveStep = (index: number, delta: number) => {
    const steps = [...draft.steps];
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    [steps[index], steps[target]] = [steps[target], steps[index]];
    set('steps', steps);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const input = draftToInput(draft, initial);
    const found = validator.validate(input);
    setErrors(found);
    if (found.length > 0) {
      document.querySelector<HTMLElement>('.field__control--invalid')?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(input);
    } finally {
      setSubmitting(false);
    }
  };

  const invalid = (field: string) => `field__control${errorFor(field) ? ' field__control--invalid' : ''}`;

  return (
    <form className="recipe-form" onSubmit={handleSubmit} noValidate>
      <section className="recipe-form__section">
        <h2 className="recipe-form__heading">Основное</h2>
        <div className="recipe-form__grid">
          <label className="field recipe-form__wide">
            <span className="field__label">Название *</span>
            <input
              className={invalid('title')}
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Например, Сырники из творога"
              maxLength={120}
            />
            {errorFor('title') && <span className="field__error">{errorFor('title')}</span>}
          </label>
          <label className="field recipe-form__wide">
            <span className="field__label">Краткое описание</span>
            <textarea
              className="field__control"
              rows={2}
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              maxLength={500}
            />
          </label>
          <label className="field">
            <span className="field__label">Категория *</span>
            <select
              className={invalid('category')}
              value={draft.category}
              onChange={(e) => set('category', e.target.value)}
            >
              <option value="">— выберите —</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {errorFor('category') && <span className="field__error">{errorFor('category')}</span>}
          </label>
          <label className="field">
            <span className="field__label">Кухня</span>
            <input
              className="field__control"
              value={draft.cuisine}
              onChange={(e) => set('cuisine', e.target.value)}
              placeholder="Русская"
            />
          </label>
          <label className="field">
            <span className="field__label">Порций *</span>
            <input
              className={invalid('servings')}
              type="number"
              min={1}
              max={50}
              value={draft.servings}
              onChange={(e) => set('servings', e.target.value)}
            />
            {errorFor('servings') && <span className="field__error">{errorFor('servings')}</span>}
          </label>
          <label className="field">
            <span className="field__label">Сложность</span>
            <select
              className="field__control"
              value={draft.difficulty}
              onChange={(e) => set('difficulty', e.target.value as Draft['difficulty'])}
            >
              <option value="easy">Легко</option>
              <option value="medium">Средне</option>
              <option value="hard">Сложно</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">Подготовка, мин</span>
            <input
              className="field__control"
              type="number"
              min={0}
              value={draft.prepTime}
              onChange={(e) => set('prepTime', e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Приготовление, мин</span>
            <input
              className={invalid('cookTime')}
              type="number"
              min={0}
              value={draft.cookTime}
              onChange={(e) => set('cookTime', e.target.value)}
            />
            {errorFor('cookTime') && <span className="field__error">{errorFor('cookTime')}</span>}
          </label>
        </div>
      </section>

      <section className="recipe-form__section">
        <div className="recipe-form__section-head">
          <h2 className="recipe-form__heading">Ингредиенты</h2>
          <span className="recipe-form__hint">Оставьте количество пустым, если «по вкусу»</span>
        </div>
        {errorFor('ingredients') && <p className="field__error">{errorFor('ingredients')}</p>}
        <ul className="recipe-form__rows">
          {draft.ingredients.map((row, i) => (
            <li key={row.key} className="recipe-form__row recipe-form__row--ingredient">
              <input
                className={invalid(`ingredients[${i}].name`)}
                aria-label={`Ингредиент ${i + 1}`}
                placeholder="Ингредиент"
                value={row.name}
                onChange={(e) => updateRow(row.key, { name: e.target.value })}
              />
              <input
                className={invalid(`ingredients[${i}].amount`)}
                aria-label={`Количество ${i + 1}`}
                placeholder="Кол-во"
                inputMode="decimal"
                value={row.amount}
                onChange={(e) => updateRow(row.key, { amount: e.target.value })}
              />
              <select
                className="field__control"
                aria-label={`Единица измерения ${i + 1}`}
                value={row.unit}
                onChange={(e) => updateRow(row.key, { unit: e.target.value })}
              >
                {[...new Set([...UNITS, row.unit])].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <button
                type="button"
                className="recipe-form__remove"
                aria-label={`Удалить ингредиент ${i + 1}`}
                disabled={draft.ingredients.length === 1}
                onClick={() =>
                  set(
                    'ingredients',
                    draft.ingredients.filter((r) => r.key !== row.key),
                  )
                }
              >
                ×
              </button>
              {(errorFor(`ingredients[${i}].name`) || errorFor(`ingredients[${i}].amount`)) && (
                <span className="field__error recipe-form__row-error">
                  {errorFor(`ingredients[${i}].name`) ?? errorFor(`ingredients[${i}].amount`)}
                </span>
              )}
            </li>
          ))}
        </ul>
        <Button variant="secondary" size="s" onClick={() => set('ingredients', [...draft.ingredients, newRow()])}>
          + Добавить ингредиент
        </Button>
      </section>

      <section className="recipe-form__section">
        <h2 className="recipe-form__heading">Шаги приготовления</h2>
        {errorFor('steps') && <p className="field__error">{errorFor('steps')}</p>}
        <ol className="recipe-form__rows">
          {draft.steps.map((step, i) => (
            <li key={i} className="recipe-form__row recipe-form__row--step">
              <span className="recipe-form__step-number">{i + 1}</span>
              <textarea
                className="field__control"
                aria-label={`Шаг ${i + 1}`}
                rows={2}
                value={step}
                placeholder="Опишите действие"
                onChange={(e) =>
                  set(
                    'steps',
                    draft.steps.map((s, j) => (j === i ? e.target.value : s)),
                  )
                }
              />
              <div className="recipe-form__step-tools">
                <button
                  type="button"
                  className="recipe-form__tool"
                  aria-label={`Переместить шаг ${i + 1} выше`}
                  disabled={i === 0}
                  onClick={() => moveStep(i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="recipe-form__tool"
                  aria-label={`Переместить шаг ${i + 1} ниже`}
                  disabled={i === draft.steps.length - 1}
                  onClick={() => moveStep(i, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="recipe-form__tool"
                  aria-label={`Удалить шаг ${i + 1}`}
                  disabled={draft.steps.length === 1}
                  onClick={() =>
                    set(
                      'steps',
                      draft.steps.filter((_, j) => j !== i),
                    )
                  }
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
        <Button variant="secondary" size="s" onClick={() => set('steps', [...draft.steps, ''])}>
          + Добавить шаг
        </Button>
      </section>

      <section className="recipe-form__section recipe-form__section--media">
        <div className="recipe-form__media-fields">
          <h2 className="recipe-form__heading">Оформление</h2>
          <label className="field">
            <span className="field__label">Теги через запятую</span>
            <input
              className="field__control"
              value={draft.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="быстро, вегетарианское"
            />
          </label>
          <label className="field">
            <span className="field__label">Ссылка на фотографию</span>
            <input
              className={invalid('imageUrl')}
              type="url"
              value={draft.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
              placeholder="https://…"
            />
            {errorFor('imageUrl') && <span className="field__error">{errorFor('imageUrl')}</span>}
          </label>
        </div>
        <div className="recipe-form__preview" aria-label="Предпросмотр обложки">
          <RecipeCover title={draft.title} category={draft.category} imageUrl={draft.imageUrl.trim() || null} />
        </div>
      </section>

      <div className="recipe-form__actions">
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
