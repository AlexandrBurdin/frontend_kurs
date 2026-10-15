import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { externalApi } from '../api';
import { ApiError } from '../api/HttpClient';
import { Button } from '../blocks/button/Button';
import { EmptyState } from '../blocks/empty-state/EmptyState';
import { ExternalCard } from '../blocks/external-card/ExternalCard';
import type { ExternalRecipePreview } from '../models/types';
import { useRecipes } from '../store/RecipesContext';
import { useToast } from '../store/ToastContext';
import '../blocks/page/page.css';
import '../blocks/recipe-grid/recipe-grid.css';
import './import-page.css';

const SUGGESTIONS = ['pancakes', 'soup', 'chicken', 'pasta', 'cake', 'salad'];

type Status = 'idle' | 'loading' | 'done' | 'error';

/** Поиск рецептов во внешнем API TheMealDB и импорт их в свою книгу. */
export function ImportPage() {
  const { upsertLocal } = useRecipes();
  const { notify } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ExternalRecipePreview[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState<string | null>(null);

  const search = async (q: string) => {
    if (q.trim().length < 2) {
      setError('Введите не менее 2 символов');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      setResults(await externalApi.search(q));
      setStatus('done');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось выполнить поиск');
      setStatus('error');
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void search(query);
  };

  const handleImport = async (preview: ExternalRecipePreview) => {
    setImporting(preview.externalId);
    try {
      const recipe = await externalApi.importRecipe(preview.externalId);
      upsertLocal(recipe);
      setResults((list) => list.map((p) => (p.externalId === preview.externalId ? { ...p, imported: true } : p)));
      notify(`«${recipe.title}» сохранён в вашей книге`, 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Не удалось импортировать рецепт', 'error');
    } finally {
      setImporting(null);
    }
  };

  return (
    <main className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Найти рецепт в сети</h1>
          <p className="page__subtitle">
            Поиск по открытой базе{' '}
            <a href="https://www.themealdb.com" target="_blank" rel="noreferrer">
              TheMealDB
            </a>{' '}
            (запросы на английском языке). Понравившийся рецепт можно сохранить в свою книгу и отредактировать.
          </p>
        </div>
      </div>

      <form className="import-page__form" onSubmit={onSubmit} role="search">
        <input
          className="field__control import-page__input"
          type="search"
          placeholder="Например, pancakes"
          aria-label="Поисковый запрос"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" loading={status === 'loading'}>
          Найти
        </Button>
      </form>
      <div className="import-page__suggestions">
        <span>Попробуйте:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="import-page__suggestion"
            onClick={() => {
              setQuery(s);
              void search(s);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {status === 'error' && <EmptyState tone="error" icon="📡" title="Поиск не выполнен" text={error} />}
      {status === 'done' && results.length === 0 && (
        <EmptyState icon="🔎" title="Ничего не найдено" text="Попробуйте другое слово на английском языке." />
      )}
      {status === 'done' && results.length > 0 && (
        <>
          <p className="import-page__count">
            Найдено рецептов: <b>{results.length}</b>. Импортированные рецепты появятся в <Link to="/">каталоге</Link>.
          </p>
          <div className="recipe-grid">
            {results.map((p, i) => (
              <ExternalCard
                key={p.externalId}
                preview={p}
                index={i}
                importing={importing === p.externalId}
                onImport={handleImport}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
