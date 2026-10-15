import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useRecipes } from '../../store/RecipesContext';
import { useUserData } from '../../store/UserDataContext';
import './header.css';

const links = [
  { to: '/', label: 'Рецепты', end: true },
  { to: '/favorites', label: 'Избранное' },
  { to: '/import', label: 'Найти в сети' },
  { to: '/shopping', label: 'Покупки' },
];

const connectionLabels = {
  open: 'Синхронизация включена',
  connecting: 'Подключение…',
  closed: 'Нет связи с сервером',
} as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { connection } = useRecipes();
  const { shoppingList, favorites } = useUserData();

  // Закрываем мобильное меню при переходе на другую страницу
  useEffect(() => setOpen(false), [location.pathname]);

  const counters: Record<string, number> = { '/favorites': favorites.size, '/shopping': shoppingList.remaining };

  return (
    <header className={`header${open ? ' header--open' : ''}`}>
      <div className="header__inner">
        <NavLink to="/" className="header__logo" aria-label="Книга рецептов — на главную">
          <span className="header__logo-mark" aria-hidden="true">
            🍲
          </span>
          <span className="header__logo-text">
            Книга <em>рецептов</em>
          </span>
        </NavLink>

        <button
          type="button"
          className="header__burger"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="visually-hidden">Меню</span>
          <span className="header__burger-line" />
        </button>

        <nav id="main-nav" className="header__nav" aria-label="Основная навигация">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `header__link${isActive ? ' header__link--active' : ''}`}
            >
              {link.label}
              {counters[link.to] > 0 && <span className="header__badge">{counters[link.to]}</span>}
            </NavLink>
          ))}
          <NavLink to="/recipes/new" className="header__cta">
            + Новый рецепт
          </NavLink>
        </nav>

        <span
          className={`header__status header__status--${connection}`}
          title={connectionLabels[connection]}
          aria-label={connectionLabels[connection]}
          role="status"
        />
      </div>
    </header>
  );
}
