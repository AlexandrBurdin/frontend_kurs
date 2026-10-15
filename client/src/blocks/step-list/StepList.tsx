import { useState } from 'react';
import './step-list.css';

interface Props {
  steps: string[];
}

/** Пошаговая инструкция: щелчок по шагу отмечает его выполненным («режим готовки»). */
export function StepList({ steps }: Props) {
  const [done, setDone] = useState<number>(-1);

  return (
    <ol className="step-list">
      {steps.map((step, i) => {
        const state = i <= done ? 'done' : i === done + 1 ? 'current' : 'pending';
        return (
          <li key={i} className={`step-list__item step-list__item--${state}`}>
            <button
              type="button"
              className="step-list__button"
              aria-pressed={i <= done}
              onClick={() => setDone(i <= done ? i - 1 : i)}
            >
              <span className="step-list__number">{i <= done ? '✓' : i + 1}</span>
              <span className="step-list__text">{step}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
