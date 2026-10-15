import { useState } from 'react';
import { RecipeModel } from '../../models/RecipeModel';
import './recipe-cover.css';

interface Props {
  title: string;
  category: string;
  imageUrl: string | null;
  size?: 'card' | 'hero';
}

/**
 * Обложка рецепта: фотография с ленивой загрузкой,
 * а при её отсутствии или ошибке — градиент по цвету категории.
 */
export function RecipeCover({ title, category, imageUrl, size = 'card' }: Props) {
  const [failed, setFailed] = useState(false);
  const slug = RecipeModel.categorySlug(category);
  const showImage = imageUrl && !failed;

  return (
    <div className={`recipe-cover recipe-cover--${slug} recipe-cover--${size}`}>
      {showImage ? (
        <img
          className="recipe-cover__image"
          src={imageUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="recipe-cover__icon" aria-hidden="true">
          {RecipeModel.iconFor(category)}
        </span>
      )}
    </div>
  );
}
