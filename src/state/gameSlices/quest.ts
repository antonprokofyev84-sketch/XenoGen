import { INITIAL_QUESTS } from '@/data/initial/quests';
import type { StoreState } from '@/state/useGameState';
import {
  addStageBindings,
  buildQuestIndexes,
  removeStageBindings,
} from '@/systems/quest/questIndexes';
import { createInitialQuestRuntimes } from '@/systems/quest/questRuntimeFactory';
import { collectExpiredTimerEffects } from '@/systems/quest/questTimers';
import { resolveText } from '@/systems/text/resolveText';
import type { QuestVarValue } from '@/types/condition.types';
import type { Effect } from '@/types/gameEffect.types';
import type { ActionId, InterceptorId, QuestTargetId } from '@/types/ids.types';
import { INITIAL_QUEST_STAGE_ID } from '@/types/questContent.types';
import type {
  QuestActionIndex,
  QuestIndexes,
  QuestInterceptorIndex,
  QuestRuntime,
  QuestRuntimeMap,
  RunningQuestRuntime,
} from '@/types/questRuntime.types';
import { isRunningQuest } from '@/types/questRuntime.types';

import type { GameSlice } from '../types';

/**
 * Runtime статических квестов.
 *
 * Квест продвигается обычными Actions и их effects: отдельного quest event bus
 * нет, поэтому слайс предоставляет только draft-операции, которые вызывает
 * общий исполнитель эффектов.
 */
export interface QuestSlice {
  questsById: QuestRuntimeMap;
  questActionIdsByTarget: QuestActionIndex;
  questInterceptorIdsByTarget: QuestInterceptorIndex;

  actions: {
    /** Создаёт runtime всех статических квестов и строит индексы целиком. */
    initializeQuests: () => void;
  };
}

export const questSelectors = {
  selectQuestById:
    (questId: string) =>
    (state: StoreState): QuestRuntime | undefined =>
      state.questSlice.questsById[questId],

  selectQuestActionIds:
    (targetId: QuestTargetId) =>
    (state: StoreState): readonly ActionId[] =>
      state.questSlice.questActionIdsByTarget[targetId] ?? [],

  selectQuestInterceptorIds:
    (targetId: QuestTargetId) =>
    (state: StoreState): readonly InterceptorId[] =>
      state.questSlice.questInterceptorIdsByTarget[targetId] ?? [],
};

/** Индексы как единый объект: обе карты всегда обновляются вместе. */
const getIndexes = (state: StoreState): QuestIndexes => ({
  actionIdsByTarget: state.questSlice.questActionIdsByTarget,
  interceptorIdsByTarget: state.questSlice.questInterceptorIdsByTarget,
});

/**
 * Квест, который ещё может меняться.
 *
 * Применение `setQuestStage`, `setQuestVar` и `snapshotDefeatedCount` к
 * завершённому квесту является ошибкой данных, а не обычной ситуацией.
 */
const requireRunningQuest = (
  state: StoreState,
  questId: string,
  operation: string,
): RunningQuestRuntime | undefined => {
  const quest = state.questSlice.questsById[questId];

  if (!quest) {
    console.warn(`${operation}: неизвестный квест "${questId}"`);
    return undefined;
  }

  if (!isRunningQuest(quest)) {
    console.warn(`${operation}: квест "${questId}" уже в состоянии "${quest.status}"`);
    return undefined;
  }

  return quest;
};

const initializeQuestsDraft = (state: StoreState) => {
  const questsById = createInitialQuestRuntimes(INITIAL_QUESTS);
  const indexes = buildQuestIndexes(INITIAL_QUESTS, questsById);

  state.questSlice.questsById = questsById;
  state.questSlice.questActionIdsByTarget = indexes.actionIdsByTarget;
  state.questSlice.questInterceptorIdsByTarget = indexes.interceptorIdsByTarget;
};

/**
 * Переводит квест на другую стадию.
 *
 * Переход в уже текущую стадию не делает ничего: журнал не дублируется, а
 * таймер стадии не начинается заново. Первый выход из `initialStage`
 * одновременно активирует квест — отдельного effect для статуса нет.
 */
const setQuestStageDraft = (state: StoreState, questId: string, stageId: string) => {
  const quest = requireRunningQuest(state, questId, 'setQuestStage');
  if (!quest || quest.stageId === stageId) return;

  const definition = INITIAL_QUESTS[questId];
  const nextStage = definition?.stages[stageId];

  if (!definition || !nextStage) {
    console.warn(`setQuestStage: квест "${questId}" не содержит стадию "${stageId}"`);
    return;
  }

  const indexes = getIndexes(state);
  removeStageBindings(indexes, definition.stages[quest.stageId]);

  quest.stageId = stageId;

  if (stageId !== INITIAL_QUEST_STAGE_ID) {
    quest.status = 'active';
  }

  if (nextStage.timeLimit) {
    quest.stageDaysLeft = nextStage.timeLimit.days;
  } else {
    delete quest.stageDaysLeft;
  }

  if (nextStage.description) {
    quest.journalEntries.push(resolveText(nextStage.description));
  }

  addStageBindings(indexes, nextStage);
};

const setQuestVarDraft = (
  state: StoreState,
  questId: string,
  key: string,
  value: QuestVarValue,
) => {
  const quest = requireRunningQuest(state, questId, 'setQuestVar');
  if (!quest) return;

  quest.vars[key] = value;
};

/** Сохраняет текущее число побед как baseline для последующего `defeated`. */
const snapshotDefeatedCountDraft = (
  state: StoreState,
  questId: string,
  key: string,
  enemyTypeId: string,
) => {
  const quest = requireRunningQuest(state, questId, 'snapshotDefeatedCount');
  if (!quest) return;

  quest.vars[key] = state.statsSlice.combat.defeated[enemyTypeId] ?? 0;
};

/** Меняет видимость в журнале в любом статусе; квест при этом не активируется. */
const setQuestJournalVisibilityDraft = (state: StoreState, questId: string, isVisible: boolean) => {
  const quest = state.questSlice.questsById[questId];
  if (!quest) return;

  quest.isHidden = !isVisible;
};

/**
 * Переводит квест в терминальное состояние.
 *
 * Привязки текущей стадии снимаются и новые не добавляются; от runtime
 * остаются только статус, видимость и история журнала.
 */
const finishQuestDraft = (state: StoreState, questId: string, status: 'completed' | 'failed') => {
  const quest = requireRunningQuest(
    state,
    questId,
    status === 'completed' ? 'completeQuest' : 'failQuest',
  );
  if (!quest) return;

  removeStageBindings(getIndexes(state), INITIAL_QUESTS[questId]?.stages[quest.stageId]);

  state.questSlice.questsById[questId] = {
    status,
    isHidden: quest.isHidden,
    journalEntries: [...quest.journalEntries],
  };
};

/**
 * Уменьшает квестовые счётчики и возвращает собранные `onExpire`.
 *
 * Effects намеренно не исполняются здесь: их выполняет общий исполнитель в
 * оркестрации конца дня, уже после обоих проходов.
 */
const collectTimerEffectsDraft = (state: StoreState): Effect[] =>
  collectExpiredTimerEffects(state.questSlice.questsById, INITIAL_QUESTS);

export const questDraft = {
  initializeQuests: initializeQuestsDraft,
  setQuestStage: setQuestStageDraft,
  setQuestVar: setQuestVarDraft,
  snapshotDefeatedCount: snapshotDefeatedCountDraft,
  setQuestJournalVisibility: setQuestJournalVisibilityDraft,
  completeQuest: (state: StoreState, questId: string) =>
    finishQuestDraft(state, questId, 'completed'),
  failQuest: (state: StoreState, questId: string) => finishQuestDraft(state, questId, 'failed'),
  collectTimerEffects: collectTimerEffectsDraft,
};

export const createQuestSlice: GameSlice<QuestSlice> = (set) => ({
  questsById: {},
  questActionIdsByTarget: {},
  questInterceptorIdsByTarget: {},

  actions: {
    initializeQuests: () =>
      set((state) => {
        initializeQuestsDraft(state);
      }),
  },
});
