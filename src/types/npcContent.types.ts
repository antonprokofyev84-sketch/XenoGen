import type { TimeOfDayId } from '@/constants';

import type { ActionId, FactionId, InterceptorId } from './ids.types';

/**
 * Контракт авторских NPC.
 *
 * NPC не знает своё текущее место: связь с работой, домом и местами
 * свободного времени задают slots соответствующих POI, а фактическое
 * размещение хранится в occupancy.
 */

/**
 * ```text
 * work     → NPC может занимать только work slot своего рабочего места
 * freeTime → NPC может занимать только freeTime slot
 * home     → NPC может занимать только home slot
 * hidden   → NPC нигде не размещается
 * ```
 */
export type NpcBaseScheduleState = 'work' | 'freeTime' | 'home' | 'hidden';

/** Обязательный полный объект: явно содержит все шесть time slots. */
export type NpcBaseSchedule = Record<TimeOfDayId, NpcBaseScheduleState>;

/** Фракция NPC вне сюжетных групп; её репутация к игроку не меняется. */
export const INDEPENDENTS_FACTION_ID: FactionId = 'independents';

export interface InitialNpc {
  name: string;

  /**
   * Обязательна: состояния «фракции нет» у NPC не существует.
   * NPC вне сюжетных фракций получают `independents`.
   */
  faction: FactionId;

  /** Отношение к игроку. Отсутствие означает `0`; рабочий диапазон `-100..100`. */
  affection?: number;

  /** Отсутствие означает `0`. Заменяет отдельный флаг знакомства. */
  timesMet?: number;

  baseSchedule: NpcBaseSchedule;

  /** Персональные действия NPC, не зависящие от места и роли. */
  actionIds?: ActionId[];

  /** Персональные автоматические события NPC. */
  interceptorIds?: InterceptorId[];
}

export type InitialNpcMap = Record<string, InitialNpc>;
