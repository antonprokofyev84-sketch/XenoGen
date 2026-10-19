import type { NpcId } from './ids.types';

/**
 * Изменяемое состояние NPC.
 *
 * Здесь хранится только то, что меняется по ходу игры. Имя, фракция,
 * расписание и персональные Action/Interceptor IDs неизменны и читаются из
 * `INITIAL_NPCS` по тому же ключу — так же, как POI читает свой
 * `POI_TEMPLATES[templateId]`.
 *
 * Текущее место NPC здесь тоже отсутствует: связь с работой, домом и местами
 * свободного времени задают slots соответствующих POI, а фактическое
 * размещение — occupancy.
 */
export interface RuntimeNpc {
  id: NpcId;

  /** Отношение к игроку; рабочий диапазон `-100..100`. */
  affection: number;

  /** Число состоявшихся встреч. `timesMet > 0` заменяет отдельный `isKnown`. */
  timesMet: number;

  /** Время последней встречи; `null` — игрок ещё не встречался с NPC. */
  lastDateMet: number | null;
}

/** Набор существующих NPC: ключи определяют, кто есть в мире. */
export type RuntimeNpcMap = Record<NpcId, RuntimeNpc>;
