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
    label: 'Осмотреться',
    result: {
      narrative: ['Ничего нового.'],
    },
  },

  'fixture:openInnerFrame': {
    label: 'Заглянуть внутрь',
    result: {
      transition: { type: 'frame', frameId: 'fixtureHub:inner' },
    },
  },

  'fixture:openKeeperInner': {
    label: 'Перейти к деталям',
    result: {
      transition: { type: 'frame', frameId: 'fixtureHub/keeper:inner' },
    },
  },

  'fixture:backToRoot': {
    label: 'Вернуться',
    result: {
      transition: { type: 'root' },
    },
  },

  'fixture:leaveSlot': {
    label: 'Отойти',
    result: {
      transition: { type: 'currentPoi' },
    },
  },

  'fixture:leaveSite': {
    label: 'Уйти',
    result: {
      transition: { type: 'parentPoi' },
    },
  },

  'fixture:jumpToOpenSite': {
    label: 'Сразу перейти на площадку',
    result: {
      transition: { type: 'poi', poiId: 'fixtureOpenSite' },
    },
  },

  'fixture:openTrade': {
    label: 'Торговать',
    result: {
      transition: { type: 'trade' },
    },
  },

  // -----------------------------------------------------------
  // Стоимость и отдых
  // -----------------------------------------------------------

  /** Отдых задаётся явным эффектом: `cost.time` сам stamina не восстанавливает. */
  'fixture:restAtHub': {
    label: 'Отдохнуть',
    cost: { money: 10, time: 120 },
    result: {
      narrative: ['Несколько часов отдыха.'],
      effects: [{ type: 'modifyPartyStamina', delta: 40 }],
    },
  },

  /** Динамическая стоимость и расход личной stamina протагониста. */
  'fixture:buyDrink': {
    label: 'Купить выпивку',
    cost: { money: resolveDrinkPrice, stamina: 2, time: 15 },
    result: {
      narrative: ['Выпивка обжигает горло.'],
    },
  },

  /** Предметная стоимость: предметы проверяются и списываются одним `cost`. */
  'fixture:payWithScrap': {
    label: 'Расплатиться хламом',
    cost: { items: [{ itemId: 'scrap', count: 3 }] },
    result: {
      effects: [{ type: 'addMoney', amount: 15 }],
    },
  },

  // -----------------------------------------------------------
  // Проверки
  // -----------------------------------------------------------

  'fixture:statCheckPersuade': {
    label: 'Надавить',
    check: {
      type: 'stat',
      statId: 'will',
      difficulty: 40,
      onSuccess: {
        narrative: [{ speakerId: '$npc', text: 'Ладно, твоя взяла.' }],
      },
      onFail: {
        narrative: [{ speakerId: '$npc', text: 'Не выйдет.' }],
        effects: [{ type: 'modifyTension', delta: 15 }],
      },
    },
  },

  'fixture:skillCheckBarter': {
    label: 'Поторговаться',
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
    label: 'Попросить об услуге',
    executionLimit: { perDay: 1 },
    check: {
      type: 'chance',
      chance: resolvePersuasionChance,
      onSuccess: {
        narrative: [{ speakerId: '$npc', text: 'Помогу.' }],
        effects: [{ type: 'addItem', itemId: 'food', count: 1 }],
      },
      onFail: {
        narrative: [{ speakerId: '$npc', text: 'Нет.' }],
      },
    },
  },

  // -----------------------------------------------------------
  // Взвешенный результат
  // -----------------------------------------------------------

  'fixture:weightedSearch': {
    label: 'Обыскать углы',
    cost: { time: 20 },
    result: [
      {
        weight: 3,
        result: {
          narrative: ['Ничего интересного.'],
        },
      },
      {
        weight: 1,
        result: {
          narrative: ['Между досками нашлась монета.'],
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
    label: 'Обсудить дела региона',
    conditions: [{ type: 'regionLevel', param: 'prosperity', min: 3 }],
    result: {
      narrative: [{ speakerId: '$npc', text: 'Торговля идёт неплохо.' }],
    },
  },

  /** Виден всегда, но disabled без предметов: требование не расходует их. */
  'fixture:requiresScrap': {
    label: 'Показать находку',
    requirements: [{ type: 'item', itemId: 'scrap', min: 1 }],
    result: {
      effects: [{ type: 'modifyTension', delta: -5 }],
    },
  },

  /** Дневной лимит: одна попытка за игровой день. */
  'fixture:dailyRumor': {
    label: 'Спросить о слухах',
    executionLimit: { perDay: 1 },
    result: {
      narrative: [{ speakerId: '$npc', text: 'У восточных руин снова видели чужаков.' }],
    },
  },

  /** Общий лимит: один раз за игру. */
  'fixture:oneTimeGift': {
    label: 'Принять подарок',
    executionLimit: { total: 1 },
    result: {
      effects: [{ type: 'addItem', itemId: 'food', count: 2 }],
    },
  },

  /** Случайная дневная видимость: результат броска сохраняется до конца дня. */
  'fixture:rareOffer': {
    label: 'Выслушать редкое предложение',
    appearanceChance: 0.3,
    result: {
      narrative: [{ speakerId: '$npc', text: 'Сегодня есть кое-что особенное.' }],
    },
  },

  // -----------------------------------------------------------
  // Tension и принудительный выход
  // -----------------------------------------------------------

  'fixture:chatWithVisitor': {
    label: 'Поговорить',
    result: {
      narrative: [{ speakerId: '$npc', text: 'Да всё как обычно.' }],
    },
  },

  /** Превышает порог forceExit за одно применение. */
  'fixture:provokeVisitor': {
    label: 'Нагрубить',
    result: {
      narrative: [{ thought: 'Пожалуй, это было лишним.' }],
      effects: [{ type: 'modifyTension', delta: 90 }],
    },
  },

  /** Действие reserved forceExit-Frame: закрывает вход в POI до конца дня. */
  'fixture:forcedLeaveWithBan': {
    label: 'Уйти',
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
    label: 'Забрать всё и уйти',
    result: {
      narrative: ['Стоянка опустела.'],
      effects: [
        { type: 'addItem', itemId: 'scrap', count: 2 },
        { type: 'markCurrentPoiForRemoval' },
      ],
      transition: { type: 'parentPoi' },
    },
  },

  /** Снимает постоянную блокировку входа другого POI. */
  'fixture:unlockBlockedSite': {
    label: 'Договориться о доступе',
    result: {
      effects: [{ type: 'setPoiEntryDisabled', poiId: 'fixtureBlockedSite', isDisabled: false }],
    },
  },

  // -----------------------------------------------------------
  // Квестовые Actions
  // -----------------------------------------------------------

  'fixture:askKeeperForWork': {
    label: 'Спросить о работе',
    conditions: [{ type: 'questStatus', questId: 'fixtureQuest', status: 'initial' }],
    result: {
      transition: { type: 'frame', frameId: 'fixtureHub/keeper:questOffer' },
    },
  },

  'fixture:acceptQuest': {
    label: 'Взяться',
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
    label: 'Отказаться',
    result: {
      transition: { type: 'root' },
    },
  },

  /** Отмечает осмотр места квестовой переменной. */
  'fixture:askKeeperAboutSite': {
    label: 'Спросить о площадке',
    conditions: [
      { type: 'questVar', questId: 'fixtureQuest', key: 'askedKeeper', notEquals: true },
    ],
    result: {
      effects: [{ type: 'setQuestVar', questId: 'fixtureQuest', key: 'askedKeeper', value: true }],
    },
  },

  /** Доступен после осмотра и достаточного числа побед. */
  'fixture:reportQuest': {
    label: 'Отчитаться',
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
