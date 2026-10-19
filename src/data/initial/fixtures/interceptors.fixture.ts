import type { InitialInterceptorMap } from '@/types/interceptor.types';

/**
 * Технические фикстуры Interceptors.
 *
 * Покрывают: silent-эффект без перехода, событие с открытием Frame, порядок по
 * `priority`, повторяемость через `conditions` и лимиты, дневной шанс появления.
 *
 * System `forceExit` сюда не входит: он не является authored definition и в
 * реестре отсутствует. Его Frame задан как `fixtureHub/keeper:forceExit`.
 */
export const FIXTURE_INTERCEPTORS: InitialInterceptorMap = {
  /**
   * silent-событие: применяет эффект и сразу продолжает очередь.
   * Высокий приоритет — выполняется первым.
   */
  'fixture:hubSilentMark': {
    priority: 200,
    executionLimit: { perDay: 1 },
    result: {
      effects: [{ type: 'setQuestVar', questId: 'fixtureQuest', key: 'visitedHub', value: true }],
    },
  },

  /**
   * Событие с переходом во Frame: приостанавливает очередь до возврата в root.
   * Приоритет ниже silent-события, поэтому выполняется после него.
   */
  'fixture:hubEvent': {
    priority: 100,
    appearanceChance: 0.5,
    executionLimit: { perDay: 1 },
    conditions: [{ type: 'questStatus', questId: 'fixtureQuest', status: 'active' }],
    result: {
      transition: { type: 'frame', frameId: 'fixtureHub:event' },
    },
  },

  /**
   * Первое представление NPC: повторяемость выражена состоянием мира
   * (`timesMet === 0`) и подкреплена общим лимитом.
   */
  'fixture:keeperIntro': {
    priority: 150,
    executionLimit: { total: 1 },
    conditions: [{ type: 'timesMet', npcId: 'fixtureKeeper', exact: 0 }],
    result: {
      narrative: [{ speakerId: '$npc', text: 'Раньше тебя здесь не видел.' }],
    },
  },

  /** Событие slot с проверкой: обе ветки учитываются как исполнение. */
  'fixture:keeperShiftGreeting': {
    appearanceChance: 0.4,
    executionLimit: { perDay: 1 },
    check: {
      type: 'chance',
      chance: 0.5,
      onSuccess: {
        narrative: [{ speakerId: '$npc', text: 'Смена выдалась спокойная.' }],
      },
      onFail: {
        narrative: [{ speakerId: '$npc', text: 'Тяжёлый день.' }],
        effects: [{ type: 'modifyTension', delta: 5 }],
      },
    },
  },
};
