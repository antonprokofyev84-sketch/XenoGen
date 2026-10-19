import { resolveText } from '@/systems/text/resolveText';
import type { InitialQuest, InitialQuestMap } from '@/types/questContent.types';
import { INITIAL_QUEST_STAGE_ID } from '@/types/questContent.types';
import type { QuestRuntimeMap, RunningQuestRuntime } from '@/types/questRuntime.types';

/**
 * Создаёт runtime квеста в состоянии «ещё не принят».
 *
 * Основная задача сразу попадает в журнал, но сам квест остаётся невидимым,
 * пока его `status` равен `initial`. Глобальный счётчик создаётся здесь же,
 * хотя уменьшается начнёт только после перехода в рабочую стадию.
 */
export function createQuestRuntime(definition: InitialQuest): RunningQuestRuntime {
  const initialStage = definition.stages[INITIAL_QUEST_STAGE_ID];

  return {
    status: 'initial',
    stageId: INITIAL_QUEST_STAGE_ID,
    isHidden: definition.isHidden ?? false,
    vars: {},
    journalEntries: [resolveText(definition.description)],
    ...(definition.timeLimit ? { questDaysLeft: definition.timeLimit.days } : {}),
    ...(initialStage?.timeLimit ? { stageDaysLeft: initialStage.timeLimit.days } : {}),
  };
}

export function createInitialQuestRuntimes(definitions: InitialQuestMap): QuestRuntimeMap {
  return Object.fromEntries(
    Object.entries(definitions).map(([questId, definition]) => [
      questId,
      createQuestRuntime(definition),
    ]),
  );
}
