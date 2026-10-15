/**
 * Абстрактный репозиторий: общий контракт хранения сущностей с идентификатором.
 * Конкретный способ хранения (файл, СУБД, память) определяется наследником.
 */
export interface Entity {
  id: string;
}

export abstract class BaseRepository<T extends Entity> {
  abstract findAll(): Promise<T[]>;
  abstract findById(id: string): Promise<T | undefined>;
  abstract create(item: T): Promise<T>;
  abstract update(id: string, patch: Partial<T>): Promise<T | undefined>;
  abstract delete(id: string): Promise<boolean>;
}
