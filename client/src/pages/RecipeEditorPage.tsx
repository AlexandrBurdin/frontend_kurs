import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { recipeApi } from '../api';
import { ApiError } from '../api/HttpClient';
import { ButtonLink } from '../blocks/button/Button';
import { EmptyState } from '../blocks/empty-state/EmptyState';
import { RecipeForm } from '../blocks/recipe-form/RecipeForm';
import type { FieldError, Recipe, RecipeInput } from '../models/types';
import { useRecipes } from '../store/RecipesContext';
import { useToast } from '../store/ToastContext';
import '../blocks/page/page.css';

/** Страница создания (без id) и редактирования (с id) рецепта. */
export function RecipeEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { saveRecipe } = useRecipes();
  const { notify } = useToast();
  const [recipe, setRecipe] = useState<Recipe | undefined>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<FieldError[]>([]);

  useEffect(() => {
    if (!id) return;
    recipeApi
      .getById(id)
      .then(setRecipe)
      .catch((err: unknown) => setLoadError(err instanceof ApiError ? err.message : 'Ошибка загрузки'));
  }, [id]);

  const handleSubmit = async (input: RecipeInput) => {
    setServerErrors([]);
    try {
      const saved = await saveRecipe(input, id);
      notify(id ? 'Изменения сохранены' : 'Рецепт добавлен в книгу', 'success');
      navigate(`/recipes/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerErrors(err.fieldErrors);
        notify(err.message, 'error');
      } else {
        notify('Не удалось сохранить рецепт', 'error');
      }
    }
  };

  if (loadError) {
    return (
      <main className="page">
        <EmptyState
          icon="🍽"
          tone="error"
          title={loadError}
          action={<ButtonLink to="/">К списку рецептов</ButtonLink>}
        />
      </main>
    );
  }

  const isEdit = Boolean(id);
  const ready = !isEdit || recipe;

  return (
    <main className="page">
      <Link to={isEdit ? `/recipes/${id}` : '/'} className="page__back">
        ← Назад
      </Link>
      <div className="page__header">
        <div>
          <h1 className="page__title">{isEdit ? 'Редактирование рецепта' : 'Новый рецепт'}</h1>
          <p className="page__subtitle">Поля, отмеченные звёздочкой, обязательны для заполнения</p>
        </div>
      </div>
      {ready ? (
        <RecipeForm
          key={recipe?.id ?? 'new'}
          initial={recipe}
          submitLabel={isEdit ? 'Сохранить изменения' : 'Добавить рецепт'}
          serverErrors={serverErrors}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
        />
      ) : (
        <p className="page__subtitle">Загрузка…</p>
      )}
    </main>
  );
}
