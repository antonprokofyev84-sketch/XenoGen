/**
 * Общие детали-фрагменты для композиции.
 * Используются несколькими типами POI чтобы избежать дублирования.
 */
import type { GeneralDetails } from './common';

/**
 * POI которое имеет template и может быть сгенерировано из blueprint.
 */
export interface TemplatedDetails extends GeneralDetails {
  poiTemplateId: string;
}

/**
 * POI которое может иметь владельца (NPC) или принадлежать фракции.
 */
export interface OwnableDetails extends GeneralDetails {
  ownerId?: string;
  faction?: string;
}

/**
 * POI которое может быть разведано и видно игроку.
 */
export interface DiscoverableDetails extends GeneralDetails {
  isDiscovered: boolean;
  explorationThreshold: number;
}

/**
 * Комбинирование всех трёх для удобства.
 */
export type CommonNonCellDetails = TemplatedDetails & OwnableDetails & DiscoverableDetails;

/**
 * Utility: делает указанные ключи optional (для initial/seed данных).
 */
export type InitialOf<T extends Record<string, any>, OptionalKeys extends keyof T = never> = Omit<
  T,
  OptionalKeys
> & { [K in OptionalKeys]?: T[K] };
