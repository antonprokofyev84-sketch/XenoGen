import type { InitialPoisByCell } from '@/types/poiContent.types';

/**
 * Технические фикстуры размещения POI.
 *
 * Дерево `0-0` покрывает: обнаруженный и скрытый дочерний POI, открытый и
 * закрытый по расписанию, временный со сроком жизни и POI с запрещённым
 * входом. Клетка `1-0` содержит POI с дневными эффектами.
 */
export const FIXTURE_POIS_BY_CELL: InitialPoisByCell = {
  '0-0': [
    {
      id: 'fixtureHub',
      templateId: 'fixtureHub',
      parentId: '0-0',
      details: {
        isDiscovered: true,
      },
    },

    {
      id: 'fixtureOpenSite',
      templateId: 'fixtureOpenSite',
      parentId: 'fixtureHub',
      details: {
        isDiscovered: true,
      },
    },

    {
      id: 'fixtureClosedSite',
      templateId: 'fixtureClosedSite',
      parentId: 'fixtureHub',
      details: {
        isDiscovered: true,
      },
    },

    {
      // isDiscovered отсутствует → false: открывается через explorationLevel.
      id: 'fixtureHiddenSite',
      templateId: 'fixtureHiddenSite',
      parentId: 'fixtureHub',
      details: {},
    },

    {
      id: 'fixtureTempSite',
      templateId: 'fixtureTempSite',
      parentId: 'fixtureHub',
      details: {
        isDiscovered: true,
        lifetimeDaysLeft: 2,
      },
    },

    {
      id: 'fixtureBlockedSite',
      templateId: 'fixtureBlockedSite',
      parentId: 'fixtureHub',
      details: {
        isDiscovered: true,
        isEntryDisabled: true,
      },
    },
  ],

  '1-0': [
    {
      id: 'fixtureDecaySite',
      templateId: 'fixtureDecaySite',
      parentId: '1-0',
      details: {
        isDiscovered: true,
      },
    },
  ],
};
