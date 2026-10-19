import type { PoiSchedule, PoiTemplateMap } from '@/types/poiContent.types';

/**
 * Технические фикстуры POI templates.
 *
 * Покрывают: расписание открытия и закрытия, slots всех трёх групп, несколько
 * кандидатов с `chance`, региональные override и modifier, дневные эффекты,
 * базовые actions и interceptors места.
 */

const ALWAYS_OPEN: PoiSchedule = {
  late_night: 'open',
  early_morning: 'open',
  morning: 'open',
  afternoon: 'open',
  evening: 'open',
  night: 'open',
};

const DAYTIME_ONLY: PoiSchedule = {
  late_night: 'closed',
  early_morning: 'closed',
  morning: 'open',
  afternoon: 'open',
  evening: 'open',
  night: 'closed',
};

export const FIXTURE_POI_TEMPLATES: PoiTemplateMap = {
  /** Центральное место: slots всех групп, базовые actions и interceptors. */
  fixtureHub: {
    details: {
      faction: 'independents',
    },

    schedule: ALWAYS_OPEN,

    actionIds: [
      'fixture:lookAround',
      'fixture:restAtHub',
      'fixture:openTrade',
      'fixture:leaveSite',
    ],

    // `fixture:hubEvent` намеренно приходит только от квестовой стадии:
    // один Interceptor не должен поступать в контекст из двух источников.
    interceptorIds: ['fixture:hubSilentMark'],

    npcSlots: {
      work: [
        {
          id: 'keeper',
          role: 'keeper',
          candidateNpcIds: ['fixtureKeeper'],
          actionIds: ['fixture:askKeeperForWork'],
          interceptorIds: ['fixture:keeperShiftGreeting'],
        },
      ],

      freeTime: [
        {
          id: 'visitor',
          role: 'visitor',
          candidateNpcIds: ['fixtureVisitorA', 'fixtureVisitorB', 'fixtureStranger'],
          chance: 0.7,
          actionIds: ['fixture:chatWithVisitor', 'fixture:provokeVisitor'],
        },
      ],

      home: [
        {
          id: 'resident',
          role: 'resident',
          candidateNpcIds: ['fixtureResident'],
          actionIds: ['fixture:chatWithVisitor'],
        },
      ],
    },

    regionLevelModifiers: {
      prosperity: 1,
    },
  },

  /** Открытый дочерний POI: обычная parent/child навигация. */
  fixtureOpenSite: {
    schedule: ALWAYS_OPEN,
    actionIds: ['fixture:lookAround', 'fixture:leaveSite'],
  },

  /** Закрыт по расписанию часть суток: переход остаётся видимым, но disabled. */
  fixtureClosedSite: {
    schedule: DAYTIME_ONLY,
    actionIds: ['fixture:lookAround', 'fixture:leaveSite'],
  },

  /** Требует разведки клетки: изначально не обнаружен. */
  fixtureHiddenSite: {
    details: {
      explorationThreshold: 40,
    },
    actionIds: ['fixture:lookAround', 'fixture:leaveSite'],
  },

  /** Временный POI: исчезает по истечении срока жизни. */
  fixtureTempSite: {
    actionIds: ['fixture:lootAndLeave'],
  },

  /** Вход запрещён изначально: снимается эффектом или квестом. */
  fixtureBlockedSite: {
    actionIds: ['fixture:lookAround', 'fixture:leaveSite'],
  },

  /** Ежедневно повышает заражение своей клетки и имеет региональный override. */
  fixtureDecaySite: {
    details: {
      faction: 'scavengers',
    },

    actionIds: ['fixture:lookAround', 'fixture:leaveSite'],

    regionLevelOverrides: {
      techLevel: 6,
    },

    regionLevelModifiers: {
      contamination: 2,
      threat: -1,
    },

    onDayPass: [
      {
        type: 'changeRegionParameter',
        cellParam: 'contamination',
        delta: 1,
        chance: 0.3,
        max: 700,
      },
    ],
  },
};
