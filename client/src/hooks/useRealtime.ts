import { useEffect, useRef, useState } from 'react';
import type { Recipe } from '../models/types';

export type RealtimeEvent =
  | { type: 'recipe:created'; recipe: Recipe; own: boolean }
  | { type: 'recipe:updated'; recipe: Recipe; own: boolean }
  | { type: 'recipe:deleted'; id: string; own: boolean };

export type ConnectionState = 'connecting' | 'open' | 'closed';

/**
 * Подписка на события сервера (Server-Sent Events).
 * EventSource самостоятельно переподключается при обрыве соединения.
 */
export function useRealtime(url: string, clientId: string, onEvent: (event: RealtimeEvent) => void): ConnectionState {
  const [state, setState] = useState<ConnectionState>('connecting');
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (typeof EventSource === 'undefined') {
      setState('closed');
      return;
    }
    const source = new EventSource(url);
    source.onopen = () => setState('open');
    source.onerror = () => setState(source.readyState === EventSource.CLOSED ? 'closed' : 'connecting');

    const parse = (e: MessageEvent<string>) => {
      const data = JSON.parse(e.data) as { payload: unknown; origin: string | null };
      return { payload: data.payload, own: data.origin === clientId };
    };
    const onCreated = (e: MessageEvent<string>) => {
      const { payload, own } = parse(e);
      handlerRef.current({ type: 'recipe:created', recipe: payload as Recipe, own });
    };
    const onUpdated = (e: MessageEvent<string>) => {
      const { payload, own } = parse(e);
      handlerRef.current({ type: 'recipe:updated', recipe: payload as Recipe, own });
    };
    const onDeleted = (e: MessageEvent<string>) => {
      const { payload, own } = parse(e);
      handlerRef.current({ type: 'recipe:deleted', id: (payload as { id: string }).id, own });
    };

    source.addEventListener('recipe:created', onCreated);
    source.addEventListener('recipe:updated', onUpdated);
    source.addEventListener('recipe:deleted', onDeleted);
    return () => source.close();
  }, [url, clientId]);

  return state;
}
