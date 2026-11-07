import type { ActionContext, InitialActionMap } from '@/types/action.types';

/**
 * Технические фикстуры Actions.
 *
 * Покрывают каждый утверждённый контракт: прямой результат, проверки stat /
 * skill / chance, взвешенный результат, conditions, requirements, все виды
 * cost, дневной шанс появления, оба лимита исполнения и все transitions,
 * кроме `combat` — бой вне скоупа миграции.
 *
 * Defaults, которые здесь не записываются: отсутствие conditions/requirements
 * не ограничивает Action, отсутствие appearanceChance равно `1`, отсутствие
 * cost означает отсутствие затрат, отсутствие transition оставляет Frame.
 */

/** Пример чистой функции: гарантированный успех при хорошем отношении. */
const resolvePersuasionChance = ({ effectiveRelation = 0 }: ActionContext): number =>
  effectiveRelation >= 20 ? 1 : 0.4;

/** Пример динамической стоимости: дороже в богатом регионе. */
const resolveDrinkPrice = ({ regionLevels }: ActionContext): number =>
  5 + (regionLevels.prosperity ?? 0);

export const FIXTURE_ACTIONS: InitialActionMap = {
  // -----------------------------------------------------------
  // Прямой результат и навигация
  // -----------------------------------------------------------

  'fixture:lookAround': {
    label: 'Look around',
    result: {
      narrative: ['Nothing new.'],
    },
  },

  'fixture:openInnerFrame': {
    label: 'Step inside',
    result: {
      transition: { type: 'frame', frameId: 'fixtureHub:inner' },
    },
  },

  'fixture:openKeeperInner': {
    label: 'Discuss the details',
    result: {
      transition: { type: 'frame', frameId: 'fixtureHub/keeper:inner' },
    },
  },

  'fixture:backToRoot': {
    label: 'Go back',
    result: {
      transition: { type: 'root' },
    },
  },

  'fixture:leaveSlot': {
    label: 'Step away',
    result: {
      transition: { type: 'currentPoi' },
    },
  },

  'fixture:leaveSite': {
    label: 'Leave',
    result: {
      transition: { type: 'parentPoi' },
    },
  },

  'fixture:jumpToOpenSite': {
    label: 'Go straight to the yard',
    result: {
      transition: { type: 'poi', poiId: 'fixtureOpenSite' },
    },
  },

  'fixture:openTrade': {
    category: 'trade',
    label: 'Trade',
    result: {
      transition: { type: 'trade' },
    },
  },

  // -----------------------------------------------------------
  // Стоимость и отдых
  // -----------------------------------------------------------

  /** Отдых задаётся явным эффектом: `cost.time` сам stamina не восстанавливает. */
  'fixture:restAtHub': {
    category: 'rest',
    label: 'Rest',
    cost: { money: 10, time: 120 },
    result: {
      narrative: ['You spend a few hours resting.'],
      effects: [{ type: 'modifyPartyStamina', delta: 40 }],
    },
  },

  /** Динамическая стоимость и расход личной stamina протагониста. */
  'fixture:buyDrink': {
    category: 'rest',
    label: 'Buy a drink',
    cost: { money: resolveDrinkPrice, stamina: 2, time: 15 },
    result: {
      narrative: ['The drink burns your throat.'],
    },
  },

  /** Itemная стоимость: предметы проверяются и списываются одним `cost`. */
  'fixture:payWithScrap': {
    label: 'Pay with scrap',
    cost: { items: [{ itemId: 'scrap', count: 3 }] },
    result: {
      effects: [{ type: 'addMoney', amount: 15 }],
    },
  },

  // -----------------------------------------------------------
  // Проверки
  // -----------------------------------------------------------

  'fixture:statCheckPersuade': {
    category: 'dialogue',
    label: 'Apply pressure',
    check: {
      type: 'stat',
      statId: 'will',
      difficulty: 40,
      onSuccess: {
        narrative: [{ speakerId: '$npc', text: 'Fine. You win.' }],
      },
      onFail: {
        narrative: [{ speakerId: '$npc', text: 'That will not work.' }],
        effects: [{ type: 'modifyTension', delta: 15 }],
      },
    },
  },

  'fixture:skillCheckBarter': {
    category: 'trade',
    label: 'Bargain',
    check: {
      type: 'skill',
      skillId: 'trade',
      difficulty: 30,
      onSuccess: {
        effects: [{ type: 'addMoney', amount: 20 }],
      },
      // Пустая по смыслу ветка записывается явно.
      onFail: {},
    },
  },

  'fixture:chanceCheckAsk': {
    category: 'dialogue',
    label: 'Ask a favor',
    executionLimit: { perDay: 1 },
    check: {
      type: 'chance',
      chance: resolvePersuasionChance,
      onSuccess: {
        narrative: [{ speakerId: '$npc', text: 'I can help.' }],
        effects: [{ type: 'addItem', itemId: 'food', count: 1 }],
      },
      onFail: {
        narrative: [{ speakerId: '$npc', text: 'No.' }],
      },
    },
  },

  // -----------------------------------------------------------
  // Взвешенный результат
  // -----------------------------------------------------------

  'fixture:weightedSearch': {
    label: 'Search the corners',
    cost: { time: 20 },
    result: [
      {
        weight: 3,
        result: {
          narrative: ['Nothing of interest.'],
        },
      },
      {
        weight: 1,
        result: {
          narrative: ['You find a coin between the boards.'],
          effects: [{ type: 'addMoney', amount: 1 }],
        },
      },
    ],
  },

  // -----------------------------------------------------------
  // Conditions, requirements, лимиты и случайная видимость
  // -----------------------------------------------------------

  /** Виден только в достаточно богатом регионе. */
  'fixture:conditionalRegionTalk': {
    label: 'Ask about the region',
    conditions: [{ type: 'regionLevel', param: 'prosperity', min: 3 }],
    result: {
      narrative: [{ speakerId: '$npc', text: 'Trade has been good.' }],
    },
  },

  /** Виден всегда, но disabled без предметов: требование не расходует их. */
  'fixture:requiresScrap': {
    label: 'Show your find',
    requirements: [{ type: 'item', itemId: 'scrap', min: 1 }],
    result: {
      effects: [{ type: 'modifyTension', delta: -5 }],
    },
  },

  /** Дневной лимит: одна попытка за игровой день. */
  'fixture:dailyRumor': {
    category: 'dialogue',
    label: 'Ask about rumors',
    executionLimit: { perDay: 1 },
    result: {
      narrative: [{ speakerId: '$npc', text: 'Strangers were seen near the eastern ruins again.' }],
    },
  },

  /** Общий лимит: один раз за игру. */
  'fixture:oneTimeGift': {
    label: 'Accept the gift',
    executionLimit: { total: 1 },
    result: {
      effects: [{ type: 'addItem', itemId: 'food', count: 2 }],
    },
  },

  /** Случайная дневная видимость: результат броска сохраняется до конца дня. */
  'fixture:rareOffer': {
    label: 'Hear a special offer',
    appearanceChance: 0.3,
    result: {
      narrative: [{ speakerId: '$npc', text: 'There is something special today.' }],
    },
  },

  // -----------------------------------------------------------
  // Tension и принудительный выход
  // -----------------------------------------------------------

  'fixture:chatWithVisitor': {
    label: 'Chat',
    result: {
      narrative: [{ speakerId: '$npc', text: 'Same as always.' }],
    },
  },

  /** Превышает порог forceExit за одно применение. */
  'fixture:provokeVisitor': {
    label: 'Be rude',
    result: {
      narrative: [{ thought: 'Perhaps that went too far.' }],
      effects: [{ type: 'modifyTension', delta: 90 }],
    },
  },

  /** Действие reserved forceExit-Frame: закрывает вход в POI до конца дня. */
  'fixture:forcedLeaveWithBan': {
    label: 'Leave',
    result: {
      effects: [{ type: 'disablePoiEntryForDays', poiId: '$currentPoi', days: 1 }],
      transition: { type: 'parentPoi' },
    },
  },

  // -----------------------------------------------------------
  // Структурные эффекты
  // -----------------------------------------------------------

  /** Завершает временный POI: пометка на удаление плюс обычный выход. */
  'fixture:lootAndLeave': {
    label: 'Take everything and leave',
    result: {
      narrative: ['The camp is empty now.'],
      effects: [
        { type: 'addItem', itemId: 'scrap', count: 2 },
        { type: 'markCurrentPoiForRemoval' },
      ],
      transition: { type: 'parentPoi' },
    },
  },

  /** Снимает постоянную блокировку входа другого POI. */
  'fixture:unlockBlockedSite': {
    label: 'Arrange access',
    result: {
      effects: [{ type: 'setPoiEntryDisabled', poiId: 'fixtureBlockedSite', isDisabled: false }],
    },
  },

  // -----------------------------------------------------------
  // Квестовые Actions
  // -----------------------------------------------------------

  'fixture:askKeeperForWork': {
    category: 'quest',
    label: 'Ask about work',
    conditions: [{ type: 'questStatus', questId: 'fixtureQuest', status: 'initial' }],
    result: {
      transition: { type: 'frame', frameId: 'fixtureHub/keeper:questOffer' },
    },
  },

  'fixture:acceptQuest': {
    category: 'quest',
    label: 'Accept',
    result: {
      effects: [
        {
          type: 'snapshotDefeatedCount',
          questId: 'fixtureQuest',
          key: 'defeatedAtStart',
          enemyTypeId: 'youngScavenger',
        },
        { type: 'setQuestStage', questId: 'fixtureQuest', stageId: 'investigate' },
      ],
      transition: { type: 'root' },
    },
  },

  'fixture:declineQuest': {
    label: 'Decline',
    result: {
      transition: { type: 'root' },
    },
  },

  /** Отмечает осмотр места квестовой переменной. */
  'fixture:askKeeperAboutSite': {
    label: 'Ask about the yard',
    conditions: [
      { type: 'questVar', questId: 'fixtureQuest', key: 'askedKeeper', notEquals: true },
    ],
    result: {
      effects: [{ type: 'setQuestVar', questId: 'fixtureQuest', key: 'askedKeeper', value: true }],
    },
  },

  /** Доступен после осмотра и достаточного числа побед. */
  'fixture:reportQuest': {
    label: 'Report back',
    requirements: [
      { type: 'questVar', questId: 'fixtureQuest', key: 'askedKeeper', equals: true },
      {
        type: 'defeated',
        enemyTypeId: 'youngScavenger',
        baselineFromVar: { questId: 'fixtureQuest', key: 'defeatedAtStart' },
        min: 2,
      },
    ],
    result: {
      effects: [{ type: 'completeQuest', questId: 'fixtureQuest' }],
      transition: { type: 'root' },
    },
  },
};
