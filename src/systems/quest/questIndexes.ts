import type { InitialQuestMap, InitialQuestStage } from '@/types/questContent.types';
import type { QuestIndexes, QuestRuntimeMap } from '@/types/questRuntime.types';
import { isRunningQuest } from '@/types/questRuntime.types';

/**
 * Производные индексы квестового контента.
 *
 * В индексах участвуют привязки текущей стадии: у непринятого квеста это
 * `initialStage`, у принятого — его рабочая стадия. Завершённый квест не
 * выдаёт ничего.
 *
 * Индексы строятся целиком при создании новой игры и дальше обновляются
 * инкрементально: смена стадии знает предыдущий `stageId`, и этого достаточно,
 * чтобы снять старые привязки и добавить новые.
 */

type BindingMap = Partial<Record<string, string[]>>;

function addBindings(index: BindingMap, bindings: BindingMap | undefined): void {
  if (!bindings) return;

  for (const [targetId, ids] of Object.entries(bindings)) {
    if (!ids || ids.length === 0) continue;

    const existing = index[targetId];

    if (existing) {
      existing.push(...ids);
    } else {
      index[targetId] = [...ids];
    }
  }
}

function removeBindings(index: BindingMap, bindings: BindingMap | undefined): void {
  if (!bindings) return;

  for (const [targetId, ids] of Object.entries(bindings)) {
    const existing = index[targetId];
    if (!existing || !ids || ids.length === 0) continue;

    const removedIds = new Set(ids);
    const keptIds = existing.filter((id) => !removedIds.has(id));
    // Пустые записи владельцев не хранятся: их отсутствие и есть «контента нет».
    if (keptIds.length === 0) {
      delete index[targetId];
    } else {
      index[targetId] = keptIds;
    }
  }
}
export function addStageBindings(
  indexes: QuestIndexes,
  stage: InitialQuestStage | undefined,
): void {
  addBindings(indexes.actionIdsByTarget, stage?.actionIdsByTarget);
  addBindings(indexes.interceptorIdsByTarget, stage?.interceptorIdsByTarget);
}
export function removeStageBindings(
  indexes: QuestIndexes,
  stage: InitialQuestStage | undefined,
): void {
  removeBindings(indexes.actionIdsByTarget, stage?.actionIdsByTarget);
  removeBindings(indexes.interceptorIdsByTarget, stage?.interceptorIdsByTarget);
}
export function buildQuestIndexes(
  definitions: InitialQuestMap,
  questsById: QuestRuntimeMap,
): QuestIndexes {
  const indexes: QuestIndexes = { actionIdsByTarget: {}, interceptorIdsByTarget: {} };

  for (const [questId, quest] of Object.entries(questsById)) {
    if (!isRunningQuest(quest)) continue;

    addStageBindings(indexes, definitions[questId]?.stages[quest.stageId]);
  }

  return indexes;
}
