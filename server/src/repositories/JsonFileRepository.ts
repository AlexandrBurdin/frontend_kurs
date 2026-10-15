import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BaseRepository, type Entity } from './BaseRepository.js';

/**
 * Репозиторий, хранящий коллекцию в JSON-файле.
 * Данные кэшируются в памяти, запись выполняется атомарно
 * (через временный файл) и последовательно (через очередь промисов).
 */
export class JsonFileRepository<T extends Entity> extends BaseRepository<T> {
  protected items: T[] | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly seed: T[] = [],
  ) {
    super();
  }

  protected async load(): Promise<T[]> {
    if (this.items) return this.items;
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      this.items = JSON.parse(raw) as T[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      this.items = structuredClone(this.seed);
      await this.persist();
    }
    return this.items;
  }

  protected persist(): Promise<void> {
    const snapshot = JSON.stringify(this.items ?? [], null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tmp = `${this.filePath}.tmp`;
      await fs.writeFile(tmp, snapshot, 'utf-8');
      await fs.rename(tmp, this.filePath);
    });
    return this.writeQueue;
  }

  async findAll(): Promise<T[]> {
    return [...(await this.load())];
  }

  async findById(id: string): Promise<T | undefined> {
    return (await this.load()).find((item) => item.id === id);
  }

  async create(item: T): Promise<T> {
    const items = await this.load();
    items.push(item);
    await this.persist();
    return item;
  }

  async update(id: string, patch: Partial<T>): Promise<T | undefined> {
    const items = await this.load();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...patch, id };
    await this.persist();
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.load();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    await this.persist();
    return true;
  }
}
