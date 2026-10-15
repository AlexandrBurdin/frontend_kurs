import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { recipeApi } from '../api';
import { ApiError } from '../api/HttpClient';
import { Button, ButtonLink } from '../blocks/button/Button';
import { ConfirmDialog } from '../blocks/confirm-dialog/ConfirmDialog';
import { EmptyState } from '../blocks/empty-state/EmptyState';
import { IngredientList } from '../blocks/ingredient-list/IngredientList';
import { RecipeCover } from '../blocks/recipe-cover/RecipeCover';
import { ServingsControl } from '../blocks/servings-control/ServingsControl';
import { StepList } from '../blocks/step-list/StepList';
import { Tag } from '../blocks/tag/Tag';
import { RecipeModel } from '../models/RecipeModel';
import type { Recipe } from '../models/types';
import { useRecipes } from '../store/RecipesContext';
import { useToast } from '../store/ToastContext';
import { useUserData } from '../store/UserDataContext';
import '../blocks/page/page.css';
import './recipe-page.css';

export function RecipePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { deleteRecipe, revision } = useRecipes();
  const { notify } = useToast();
  const { isFavorite, toggleFavorite, addToShoppingList } = useUserData();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [servings, setServings] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Загрузка рецепта; revision меняется при изменениях с других устройств
  useEffect(() => {
    let cancelled = false;
    recipeApi
      .getById(id)
      .then((r) => {
        if (cancelled) return;
        setRecipe(r);
        setServings((prev) => (recipe?.id === r.id ? prev : r.servings));
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Ошибка загрузки');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, revision]);

  const model = useMemo(() => (recipe ? new RecipeModel(recipe) : null), [recipe]);
  const scaled = useMemo(() => model?.scaleIngredients(servings) ?? [], [model, servings]);

  if (error) {
    return (
      <main className="page">
        <EmptyState icon="🍽" tone="error" title={error} action={<ButtonLink to="/">К списку рецептов</ButtonLink>} />
      </main>
    );
  }
  if (!recipe || !model) {
    return (
      <main className="page">
        <div className="recipe-page__loading" aria-busy="true">
          Загрузка рецепта…
        </div>
      </main>
    );
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      notify(`Рецепт «${recipe.title}» удалён`, 'success');
      navigate('/');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Не удалось удалить рецепт', 'error');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const favorite = isFavorite(recipe.id);

  return (
    <main className="page recipe-page">
      <Link to="/" className="page__back">
        ← Все рецепты
      </Link>

      <RecipeCover title={recipe.title} category={recipe.category} imageUrl={recipe.imageUrl} size="hero" />

      <header className="recipe-page__header">
        <div className="recipe-page__heading">
          <div className="recipe-page__badges">
            <Tag label={recipe.category} tone="accent" />
            {recipe.cuisine && <Tag label={`${recipe.cuisine} кухня`} tone="herb" />}
            {model.isImported && <Tag label="TheMealDB" tone="herb" />}
          </div>
          <h1 className="recipe-page__title">{recipe.title}</h1>
          {recipe.description && <p className="recipe-page__description">{recipe.description}</p>}
        </div>
        <div className="recipe-page__actions">
          <Button
            variant="secondary"
            aria-pressed={favorite}
            icon={favorite ? '♥' : '♡'}
            onClick={() => toggleFavorite(recipe.id)}
          >
            {favorite ? 'В избранном' : 'В избранное'}
          </Button>
          <ButtonLink to={`/recipes/${recipe.id}/edit`} variant="secondary" icon="✎">
            Изменить
          </ButtonLink>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Удалить
          </Button>
        </div>
      </header>

      <dl className="recipe-page__facts">
        <div className="recipe-page__fact">
          <dt>Подготовка</dt>
          <dd>{RecipeModel.formatMinutes(recipe.prepTime)}</dd>
        </div>
        <div className="recipe-page__fact">
          <dt>Приготовление</dt>
          <dd>{RecipeModel.formatMinutes(recipe.cookTime)}</dd>
        </div>
        <div className="recipe-page__fact">
          <dt>Всего</dt>
          <dd>{model.formattedTime}</dd>
        </div>
        <div className="recipe-page__fact">
          <dt>Сложность</dt>
          <dd>{model.difficultyLabel}</dd>
        </div>
      </dl>

      <div className="recipe-page__content">
        <aside className="recipe-page__sidebar">
          <div className="recipe-page__panel">
            <div className="recipe-page__panel-head">
              <h2 className="recipe-page__section-title">Ингредиенты</h2>
            </div>
            <ServingsControl value={servings} onChange={setServings} />
            <IngredientList key={servings} ingredients={scaled} />
            <Button
              variant="secondary"
              className="recipe-page__shopping"
              icon="🛒"
              onClick={() => {
                addToShoppingList(recipe.title, scaled);
                notify('Ингредиенты добавлены в список покупок', 'success');
              }}
            >
              В список покупок
            </Button>
          </div>
        </aside>

        <section className="recipe-page__steps">
          <h2 className="recipe-page__section-title">Приготовление</h2>
          <p className="recipe-page__hint">Нажимайте на шаги по мере выполнения — так вы не собьётесь.</p>
          <StepList steps={recipe.steps} />
          {recipe.tags.length > 0 && (
            <div className="recipe-page__tags">
              {recipe.tags.map((t) => (
                <Tag key={t} label={t} />
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Удалить рецепт?"
        text={`Рецепт «${recipe.title}» будет удалён без возможности восстановления.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </main>
  );
}
