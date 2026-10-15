import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './blocks/error-boundary/ErrorBoundary';
import { Header } from './blocks/header/Header';
import { ToastStack } from './blocks/toast-stack/ToastStack';
import { CatalogPage } from './pages/CatalogPage';
import { RecipesProvider } from './store/RecipesContext';
import { ToastProvider } from './store/ToastContext';
import { UserDataProvider } from './store/UserDataContext';

// Второстепенные страницы загружаются по требованию (code splitting)
const RecipePage = lazy(() => import('./pages/RecipePage').then((m) => ({ default: m.RecipePage })));
const RecipeEditorPage = lazy(() => import('./pages/RecipeEditorPage').then((m) => ({ default: m.RecipeEditorPage })));
const ImportPage = lazy(() => import('./pages/ImportPage').then((m) => ({ default: m.ImportPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then((m) => ({ default: m.FavoritesPage })));
const ShoppingPage = lazy(() => import('./pages/ShoppingPage').then((m) => ({ default: m.ShoppingPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="page" aria-busy="true" />}>
      <Routes>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/recipes/new" element={<RecipeEditorPage />} />
        <Route path="/recipes/:id" element={<RecipePage />} />
        <Route path="/recipes/:id/edit" element={<RecipeEditorPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/shopping" element={<ShoppingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <ToastProvider>
      <UserDataProvider>
        <RecipesProvider>
          <Header />
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
          <ToastStack />
        </RecipesProvider>
      </UserDataProvider>
    </ToastProvider>
  );
}
