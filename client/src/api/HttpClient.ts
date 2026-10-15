import type { FieldError } from '../models/types';

/** Ошибка обращения к API с HTTP-статусом и (при наличии) ошибками валидации полей. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

type Query = Record<string, string | number | undefined | null>;

/**
 * Базовый HTTP-клиент на основе Fetch API.
 * Отвечает за построение URL, сериализацию JSON, таймаут и единообразную обработку ошибок.
 * Конкретные API-клиенты наследуются от него и описывают только предметные методы.
 */
export class HttpClient {
  constructor(
    protected readonly baseUrl: string,
    private readonly defaultHeaders: Record<string, string> = {},
    private readonly timeoutMs = 10_000,
  ) {}

  protected get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>('GET', path + HttpClient.toQueryString(query));
  }

  protected post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  protected put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  protected delete<T = void>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  static toQueryString(query?: Query): string {
    if (!query) return '';
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await fetch(this.baseUrl + path, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...this.defaultHeaders,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw new ApiError('Сервер недоступен. Проверьте подключение к сети', 0);
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 204) return undefined as T;

    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const payload = (data ?? {}) as { message?: string; errors?: FieldError[] };
      throw new ApiError(payload.message ?? `Ошибка ${response.status}`, response.status, payload.errors ?? []);
    }
    return data as T;
  }
}
