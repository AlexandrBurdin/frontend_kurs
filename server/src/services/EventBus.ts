import type { Response } from 'express';

export type RecipeEventType = 'recipe:created' | 'recipe:updated' | 'recipe:deleted';

export interface RecipeEvent {
  type: RecipeEventType;
  payload: unknown;
  /** Идентификатор клиента-инициатора, чтобы он не получал уведомление о собственном действии */
  origin?: string;
}

/**
 * Шина событий реального времени на основе Server-Sent Events (SSE).
 * Хранит открытые HTTP-соединения клиентов и рассылает им события.
 */
export class EventBus {
  private clients = new Set<Response>();
  private heartbeat: NodeJS.Timeout | null = null;

  constructor(private readonly heartbeatMs = 25_000) {}

  subscribe(res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 3000\n\n');
    this.clients.add(res);
    this.ensureHeartbeat();
    res.on('close', () => {
      this.clients.delete(res);
      if (this.clients.size === 0) this.stopHeartbeat();
    });
  }

  publish(event: RecipeEvent): void {
    const data = JSON.stringify({ payload: event.payload, origin: event.origin ?? null });
    const message = `event: ${event.type}\ndata: ${data}\n\n`;
    for (const client of this.clients) client.write(message);
  }

  get size(): number {
    return this.clients.size;
  }

  private ensureHeartbeat(): void {
    if (this.heartbeat) return;
    // Комментарий SSE не дает прокси-серверам закрыть «молчащее» соединение
    this.heartbeat = setInterval(() => {
      for (const client of this.clients) client.write(': ping\n\n');
    }, this.heartbeatMs);
    this.heartbeat.unref();
  }

  private stopHeartbeat(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
  }
}
