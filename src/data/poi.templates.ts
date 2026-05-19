import type { PoiTemplate } from '@/types/poi';

export const POI_TEMPLATES_DB: Record<string, PoiTemplate> = {
  scavenger_group: {
    // ===== base (applies to all levels) =====
    details: {
      faction: 'scavengers',
      explorationThreshold: 35,
    },

    services: [
      'attack',
      'trade',
      'leave',
      'testService',
      'mock',
      'testDex',
      'testStr',
      'testSurvival',
      'testLuck',
    ],

    triggers: {
      onDayPass: [
        {
          do: [
            {
              kind: 'changeCurrentCellParam',
              cellParam: 'threat',
              delta: 1,
              chance: 0.3,
            },
            {
              kind: 'changeCurrentCellParam',
              cellParam: 'prosperity',
              delta: -1,
              chance: 0.3,
            },
          ],
        },
      ],
    },
  },

  tavern: {
    details: {
      explorationThreshold: 0,
    },
    services: ['rest', 'leave'],
  },

  tavern_bartender_spot: {
    isLocalSpot: true,
    details: {
      explorationThreshold: 0,
    },
    services: ['trade', 'leave'],
  },

  tavern_waitress_spot: {
    isLocalSpot: true,
    details: {
      explorationThreshold: 0,
    },
    services: ['leave'],
  },

  tavern_free_table: {
    isLocalSpot: true,
    details: {
      explorationThreshold: 0,
    },
    services: ['leave'],
  },

  scavenger_patrol: {
    services: [
      'attack',
      'trade',
      'leave',
      'testService',
      'mock',
      'testDex',
      'testStr',
      'testSurvival',
      'testLuck',
    ],

    details: {
      faction: 'scavengers',
      explorationThreshold: 25,
      lifetimeDays: 7,
    },

    triggers: {
      onDayPass: [
        {
          do: [
            {
              kind: 'changeCurrentCellParam',
              cellParam: 'threat',
              delta: 1,
              chance: 0.3,
            },
            {
              kind: 'changeCurrentCellParam',
              cellParam: 'prosperity',
              delta: -1,
              chance: 0.3,
            },
          ],
        },
      ],
    },
  },
};
