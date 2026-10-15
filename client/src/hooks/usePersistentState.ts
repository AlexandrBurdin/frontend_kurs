import { useEffect, useState } from 'react';

/**
 * Состояние, сохраняемое в localStorage.
 * Ошибки доступа к хранилищу (приватный режим, квота) не ломают приложение.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (raw: string | null) => T = (raw) => (raw === null ? initial : (JSON.parse(raw) as T)),
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      return deserialize(window.localStorage.getItem(key));
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, serialize(value));
    } catch {
      /* хранилище недоступно — работаем только в памяти */
    }
  }, [key, value, serialize]);

  return [value, setValue];
}
