import type { ExternalRecipePreview } from '../../models/types';
import { Button } from '../button/Button';
import { RecipeCover } from '../recipe-cover/RecipeCover';
import { Tag } from '../tag/Tag';
import './external-card.css';

interface Props {
  preview: ExternalRecipePreview;
  index: number;
  importing: boolean;
  onImport: (preview: ExternalRecipePreview) => void;
}

/** Карточка рецепта из внешнего API с кнопкой импорта в свою книгу. */
export function ExternalCard({ preview, index, importing, onImport }: Props) {
  return (
    <article className="external-card" style={{ '--i': index } as React.CSSProperties} data-testid="external-card">
      <RecipeCover title={preview.title} category={preview.category} imageUrl={preview.imageUrl} />
      <div className="external-card__body">
        <h3 className="external-card__title">{preview.title}</h3>
        <p className="external-card__meta">
          {[preview.category, preview.cuisine].filter(Boolean).join(' · ')} · {preview.ingredientsCount} ингр.
        </p>
        {preview.tags.length > 0 && (
          <div className="external-card__tags">
            {preview.tags.slice(0, 3).map((t) => (
              <Tag key={t} label={t} />
            ))}
          </div>
        )}
        <div className="external-card__actions">
          {preview.imported ? (
            <span className="external-card__done">✓ В вашей книге</span>
          ) : (
            <Button size="s" loading={importing} onClick={() => onImport(preview)}>
              Сохранить в книгу
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
