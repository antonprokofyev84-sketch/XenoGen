import type { LocalizedText } from './common.types';
import type { Effect } from './gameEffect.types';
import type { ActionId, InterceptorId, QuestStageId, QuestTargetId } from './ids.types';

/**
 * Контракт статических квестов.
 *
 * Квест продвигается обычными Actions и их effects; отдельного quest event bus
 * нет. Стадия хранит только привязки по владельцам, а полные definitions
 * Actions и Interceptors находятся в своих реестрах.
 */

/** Каждый квест обязан содержать стадию с этим ID. */
export const INITIAL_QUEST_STAGE_ID = 'initialStage';

/**
 * Отложенный запуск effects по истечении срока.
 *
 * Сам по себе тайм-лимит не означает провал: `onExpire` может завершить квест,
 * перевести его на другую стадию или применить любые обычные effects.
 */
export interface QuestTimeLimit {
  /** Положительное целое число дней. */
  days: number;
  onExpire: Effect[];
  showInJournal: boolean;
}

export interface InitialQuestStage {
  title?: LocalizedText;

  /** Запись, добавляемая в историю квеста при переходе на стадию. */
  description?: LocalizedText;

  /** Тайм-лимит конкретной стадии; работает и для `initialStage`. */
  timeLimit?: QuestTimeLimit;

  /** Какие Actions текущая стадия добавляет конкретным NPC и POI. */
  actionIdsByTarget?: Partial<Record<QuestTargetId, ActionId[]>>;

  /** Какие Interceptors текущая стадия добавляет конкретным NPC и POI. */
  interceptorIdsByTarget?: Partial<Record<QuestTargetId, InterceptorId[]>>;
}

export interface InitialQuest {
  name: LocalizedText;

  /** Основная задача квеста; становится первой записью журнала. */
  description: LocalizedText;

  /** Если `true`, квест не показывается в журнале. Отсутствие означает `false`. */
  isHidden?: boolean;

  /** Общий тайм-лимит квеста; не уменьшается, пока status === `initial`. */
  timeLimit?: QuestTimeLimit;

  stages: Record<QuestStageId, InitialQuestStage>;
}

export type InitialQuestMap = Record<string, InitialQuest>;
