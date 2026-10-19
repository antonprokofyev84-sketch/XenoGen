import type { Effect } from '@/types/gameEffect.types';
import type { InitialQuestMap, QuestTimeLimit } from '@/types/questContent.types';
import type { QuestRuntimeMap, RunningQuestRuntime } from '@/types/questRuntime.types';
import { isRunningQuest } from '@/types/questRuntime.types';

/**
 * Квестовые таймеры конца дня.
 *
 * Тайм-лимит — отложенный запуск effects, а не провал сам по себе: что именно
 * произойдёт, решает `onExpire`.
 *
 * Проход собирает effects, но **не исполняет** их. Это и даёт требуемый
 * порядок: сначала уменьшаются все стадийные счётчики, затем все квестовые, и
 * только после обоих проходов собранный массив выполняется целиком. Поэтому
 * таймер стадии, созданной этими же effects, в тот же день не уменьшается.
 */

/** Запись журнала при срабатывании таймера с `showInJournal`. */
export const EXPIRED_TIMER_JOURNAL_ENTRY = 'Срок истёк';

type QuestCounterKey = 'stageDaysLeft' | 'questDaysLeft';

/**
 * Уменьшает один счётчик и, если он дошёл до нуля, собирает его `onExpire`.
 *
 * Счётчик на нуле удаляется и из definition больше не восстанавливается,
 * поэтому `onExpire` выполняется ровно один раз.
 */
function decreaseQuestCounter(
  quest: RunningQuestRuntime,
  counterKey: QuestCounterKey,
  timeLimit: QuestTimeLimit | undefined,
  effects: Effect[],
): void {
  const next = (quest[counterKey] ?? 0) - 1;

  if (next > 0) {
    quest[counterKey] = next;
    return;
  }

  delete quest[counterKey];

  if (!timeLimit) return;

  if (timeLimit.showInJournal) {
    quest.journalEntries.push(EXPIRED_TIMER_JOURNAL_ENTRY);
  }

  effects.push(...timeLimit.onExpire);
}

export function collectExpiredTimerEffects(
  questsById: QuestRuntimeMap,
  definitions: InitialQuestMap,
): Effect[] {
  const effects: Effect[] = [];

  for (const [questId, quest] of Object.entries(questsById)) {
    if (!isRunningQuest(quest) || quest.stageDaysLeft === undefined) continue;

    const stage = definitions[questId]?.stages[quest.stageId];
    decreaseQuestCounter(quest, 'stageDaysLeft', stage?.timeLimit, effects);
  }

  // Общий срок идёт только у принятого квеста.
  for (const [questId, quest] of Object.entries(questsById)) {
    if (!isRunningQuest(quest) || quest.status !== 'active') continue;
    if (quest.questDaysLeft === undefined) continue;

    decreaseQuestCounter(quest, 'questDaysLeft', definitions[questId]?.timeLimit, effects);
  }

  return effects;
}
