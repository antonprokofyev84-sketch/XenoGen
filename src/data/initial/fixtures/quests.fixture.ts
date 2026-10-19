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
    name: 'Техническое поручение',
    description: 'Выполнить проверочное поручение смотрителя.',

    timeLimit: {
      days: 10,
      showInJournal: true,
      onExpire: [{ type: 'failQuest', questId: 'fixtureQuest' }],
    },

    stages: {
      initialStage: {
        description: 'Смотритель может предложить работу.',
        actionIdsByTarget: {
          fixtureKeeper: ['fixture:askKeeperForWork'],
        },
      },

      investigate: {
        title: 'Осмотр',
        description: 'Осмотреть площадку и расспросить смотрителя.',

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
        title: 'Отчёт',
        description: 'Вернуться к смотрителю.',
        actionIdsByTarget: {
          fixtureKeeper: ['fixture:reportQuest'],
        },
      },
    },
  },
  /** Скрытый квест: хранит факты мира, но не показывается в журнале. */
  fixtureHiddenQuest: {
    name: 'Техническое наблюдение',
    description: 'Скрытый квест для проверки видимости журнала.',
    isHidden: true,

    stages: {
      initialStage: {
        description: 'Наблюдение ещё не начато.',
      },
    },
  },
};
