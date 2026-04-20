import type { PoiTemplate } from '@/types/poi';

export const POI_TEMPLATES_DB: Record<string, PoiTemplate> = {
  scavenger_group: {
    type: 'encounter',

    // ===== base (applies to all levels) =====
    details: {
      poiTemplateId: 'scavenger_group',
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
          do: [{ kind: 'modifySelfProgress', delta: 1 }],
        },
      ],
    },

    // ===== per-level overrides =====
    levels: {
      0: {
        details: {
          store: null,
          combatUnits: null,
          progressMax: 10,
        },
      },

      1: {
        details: {
          store: null,
          combatUnits: null,
          progressMax: 10,
        },
      },

      2: {
        details: {
          store: null,
          combatUnits: null,
          progressMax: 10,
        },
      },
      3: {
        details: {
          store: null,
          combatUnits: null,
          progressMax: 15,
        },
      },

      4: {
        details: {
          store: null,
          combatUnits: null,
          progressMax: 15,
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

      5: {
        details: {
          store: null,
          combatUnits: null,
          // progressMax intentionally omitted → infinite / no level-up
        },
        triggers: {
          onDayPass: [
            {
              do: [
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'threat',
                  delta: 1,
                  chance: 0.6,
                },
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'prosperity',
                  delta: -1,
                  chance: 0.6,
                },
              ],
            },
          ],
        },
      },
    },
  },

  tavern: {
    type: 'facility',
    details: {
      poiTemplateId: 'tavern',
      explorationThreshold: 0,
    },
    services: ['rest', 'leave'],
  },

  tavern_bartender_spot: {
    type: 'spot',
    details: {
      poiTemplateId: 'tavern_bartender_spot',
      explorationThreshold: 0,
    },
    services: ['trade', 'leave'],
  },

  tavern_waitress_spot: {
    type: 'spot',
    details: {
      poiTemplateId: 'tavern_waitress_spot',
      explorationThreshold: 0,
    },
    services: ['leave'],
  },

  tavern_free_table: {
    type: 'spot',
    details: {
      poiTemplateId: 'tavern_free_table',
      explorationThreshold: 0,
    },
    services: ['leave'],
  },

  scavenger_patrol: {
    type: 'encounter',

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

    // ===== base (applies to all levels) =====
    details: {
      poiTemplateId: 'scavenger_patrol',
      faction: 'scavengers',
      explorationThreshold: 25,
      lifetimeDays: 7,
    },

    // ===== per-level overrides =====
    levels: {
      0: {},
      1: {},
      2: {},
      3: {},
      4: {
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
      5: {
        triggers: {
          onDayPass: [
            {
              do: [
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'threat',
                  delta: 1,
                  chance: 0.6,
                },
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'prosperity',
                  delta: -1,
                  chance: 0.6,
                },
              ],
            },
          ],
        },
      },
    },
  },
};
