import { Button, ButtonLink } from '../blocks/button/Button';
import { EmptyState } from '../blocks/empty-state/EmptyState';
import { ShoppingListView } from '../blocks/shopping-list/ShoppingListView';
import { ShoppingList } from '../models/ShoppingList';
import { useUserData } from '../store/UserDataContext';
import '../blocks/page/page.css';

export function ShoppingPage() {
  const { shoppingList, updateShoppingList } = useUserData();

  return (
    <main className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Список покупок</h1>
          <p className="page__subtitle">
            Одинаковые продукты из разных рецептов объединяются автоматически.
            {shoppingList.size > 0 && ` Осталось купить: ${shoppingList.remaining} из ${shoppingList.size}.`}
          </p>
        </div>
        {shoppingList.size > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="s" onClick={() => updateShoppingList((l) => l.clearChecked())}>
              Убрать купленное
            </Button>
            <Button variant="danger" size="s" onClick={() => updateShoppingList(() => ShoppingList.empty())}>
              Очистить
            </Button>
          </div>
        )}
      </div>
      {shoppingList.size === 0 ? (
        <EmptyState
          icon="🛒"
          title="Список покупок пуст"
          text="Откройте рецепт и нажмите «В список покупок» — ингредиенты появятся здесь."
          action={<ButtonLink to="/">Выбрать рецепт</ButtonLink>}
        />
      ) : (
        <ShoppingListView
          list={shoppingList}
          onToggle={(key) => updateShoppingList((l) => l.toggle(key))}
          onRemove={(key) => updateShoppingList((l) => l.remove(key))}
        />
      )}
    </main>
  );
}
