import type { InitialQuestMap } from '@/types/questContent.types';

/**
 * Технические фикстуры квестов.
 *
 * Покрывают: `initialStage`, переход на рабочую стадию, квестовые переменные,
 * привязки Actions и Interceptors по владельцам, таймер стадии и общий таймер
 * квеста, скрытый квест и терминальное состояние.
 *
 * Тексты нейтральные и не задают production-нарратив.
 */
export const FIXTURE_QUESTS: InitialQuestMap = {
  fixtureQuest: {
    name: 'A small errand',
    description: 'Complete an errand for the keeper.',

    timeLimit: {
      days: 10,
      showInJournal: true,
      onExpire: [{ type: 'failQuest', questId: 'fixtureQuest' }],
    },

    stages: {
      initialStage: {
        description: 'The keeper may have work for you.',
        actionIdsByTarget: {
          fixtureKeeper: ['fixture:askKeeperForWork'],
        },
      },

      investigate: {
        title: 'Investigation',
        description: 'Inspect the yard and question the keeper.',

        timeLimit: {
          days: 3,
          showInJournal: true,
          onExpire: [
            { type: 'setQuestVar', questId: 'fixtureQuest', key: 'wasLate', value: true },
            { type: 'setQuestStage', questId: 'fixtureQuest', stageId: 'report' },
          ],
        },
        actionIdsByTarget: {
          fixtureKeeper: ['fixture:askKeeperAboutSite'],
          fixtureOpenSite: ['fixture:unlockBlockedSite'],
        },
        interceptorIdsByTarget: {
          fixtureHub: ['fixture:hubEvent'],
        },
      },
      report: {
        title: 'Report',
        description: 'Return to the keeper.',
        actionIdsByTarget: {
          fixtureKeeper: ['fixture:reportQuest'],
        },
      },
    },
  },
  /** Скрытый квест: хранит факты мира, но не показывается в журнале. */
  fixtureHiddenQuest: {
    name: 'Observation',
    description: 'A hidden quest for checking journal visibility.',
    isHidden: true,

    stages: {
      initialStage: {
        description: 'Observation has not started yet.',
      },
    },
  },
};
