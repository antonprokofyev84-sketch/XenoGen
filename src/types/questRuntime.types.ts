import type { QuestVarValue } from './condition.types';
import type { ActionId, InterceptorId, QuestId, QuestStageId, QuestTargetId } from './ids.types';

/**
 * Runtime квестов.
 *
 * Создаётся сразу для всех initial-квестов, включая ещё не принятые: пустой
 * `vars`, запись журнала с основной задачей и глобальный таймер существуют
 * заранее. Завершённый квест остаётся в state в компактной форме — только
 * статус, видимость и история журнала.
 */

export interface RunningQuestRuntime {
  status: 'initial' | 'active';

  stageId: QuestStageId;

  /** Скрытый квест живёт полноценно, но не показывается в журнале. */
  isHidden: boolean;

  vars: Record<string, QuestVarValue>;

  /** Уже разрешённые строки: последующие изменения контента их не меняют. */
  journalEntries: string[];

  /** Общий срок квеста; не уменьшается, пока `status === 'initial'`. */
  questDaysLeft?: number;

  /** Срок текущей стадии; работает и для `initialStage`. */
  stageDaysLeft?: number;
}

export interface FinishedQuestRuntime {
  status: 'completed' | 'failed';
  isHidden: boolean;
  journalEntries: string[];
}

export type QuestRuntime = RunningQuestRuntime | FinishedQuestRuntime;

export type QuestRuntimeMap = Record<QuestId, QuestRuntime>;

/** Квест, который ещё может меняться: только такой хранит стадию, vars и таймеры. */
export function isRunningQuest(quest: QuestRuntime): quest is RunningQuestRuntime {
  return quest.status === 'initial' || quest.status === 'active';
}

/**
 * Производные индексы «владелец → контент текущей стадии».
 *
 * Содержат только ID; источником истины остаются definitions квестов и их
 * runtime. Нужны, чтобы каждое взаимодействие не обходило все квесты.
 */
export type QuestActionIndex = Partial<Record<QuestTargetId, ActionId[]>>;

export type QuestInterceptorIndex = Partial<Record<QuestTargetId, InterceptorId[]>>;

export interface QuestIndexes {
  actionIdsByTarget: QuestActionIndex;
  interceptorIdsByTarget: QuestInterceptorIndex;
}
