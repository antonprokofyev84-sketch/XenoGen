import type { PoiTemplate } from '@/types/poi.types';

export const POI_TEMPLATES_DB: Record<string, PoiTemplate> = {
  shop: {
    poiTemplateId: 'shop',
    type: 'facility',
    faction: 'civilians',
    baseStaffSettings: {
      owner: {
        id: 'TestShopOwner',
        canBeReplacedBy: 'TestShopOwnersWifeId',
        canBeReplacedByStaff: true,
      },
      guard: {
        id: 'TestShopGuard',
      },
    },
    levels: {
      0: {
        isVisible: false,
        tags: ['abandoned'],
        progressMax: 100,
        triggers: {
          onDayPass: [
            {
              do: [
                { kind: 'cellParamToSelfProgress', cellParam: 'prosperity', base: 0, factor: 1 },
              ],
            },
          ],
          onProgressMax: [{ do: [{ kind: 'levelUpSelf' }] }],
          onProgressMin: [{ do: [{ kind: 'levelDownSelf' }] }],
        },
      },
      1: {
        unavailableDays: 3,
        levelLockDays: 7,
        isVisible: true,
        tags: ['business'],
        progressMax: 100,
        store: {
          restockDays: 7,
          money: 500,
          items: [
            { templateId: 'first_aid_kit', quantity: 5, rarity: 'common', type: 'consumable' },
            { templateId: 'bandage', quantity: 10, rarity: 'common' },
          ],
        },
        staff: ['owner', 'guard'],
        triggers: {
          onDayPass: [
            {
              do: [
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'prosperityProgress',
                  delta: 2,
                  chance: 0.8,
                },
                { kind: 'cellParamToSelfProgress', cellParam: 'prosperity', base: 1, factor: 0.5 },
              ],
            },
          ],
          onProgressMax: [{ do: [{ kind: 'levelUpSelf' }] }],
          onProgressMin: [{ do: [{ kind: 'levelDownSelf' }] }],
        },
      },
    },
  },

  scavenger_group: {
    type: 'encounter',
    details: {
      poiTemplateId: 'scavenger_group',
      faction: 'scavengers',
      perceptionThreshold: 35,
      levels: {
        4: {
        store: null,
        combatUnits: null,
        progressMax: 15,
        triggers: {
          onDayPass: [
            {
              do: [
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'threatProgress',
                  delta: 1,
                  chance: 0.3,
                },
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'prosperityProgress',
                  delta: -1,
                  chance: 0.3,
                },
                { kind: 'modifySelfProgress', delta: 1 },
              ],
            },
          ],
          onProgressMax: [{ do: [{ kind: 'levelUpSelf' }] }],
        },
      },
        5: {
        store: null,
        combatUnits: null,
        triggers: {
          onDayPass: [
            {
              do: [
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'threatProgress',
                  delta: 1,
                  chance: 0.6,
                },
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'prosperityProgress',
                  delta: -1,
                  chance: 0.6,
                },
              ],
            },
          ],
        },
      }
    }
  }



  scavenger_group: {
    poiTemplateId: 'scavenger_group',
    type: 'encounter',
    faction: 'scavengers',
    perceptionThreshold: 35,

    levels: {
      0: {
        store: null,
        combatUnits: null,
        progressMax: 10,
        triggers: {
          onDayPass: [
            {
              do: [{ kind: 'modifySelfProgress', delta: 1 }],
            },
          ],
          onProgressMax: [{ do: [{ kind: 'levelUpSelf' }] }],
        },
      },

      1: {
        store: null,
        combatUnits: null,
        progressMax: 10,
        triggers: {
          onDayPass: [{ do: [{ kind: 'modifySelfProgress', delta: 1 }] }],
          onProgressMax: [{ do: [{ kind: 'levelUpSelf' }] }],
        },
      },

      2: {
        store: null,
        combatUnits: null,
        progressMax: 10,
        triggers: {
          onDayPass: [{ do: [{ kind: 'modifySelfProgress', delta: 1 }] }],
          onProgressMax: [{ do: [{ kind: 'levelUpSelf' }] }],
        },
      },

      3: {
        store: null,
        combatUnits: null,
        progressMax: 15,
        triggers: {
          onDayPass: [{ do: [{ kind: 'modifySelfProgress', delta: 1 }] }],
          onProgressMax: [{ do: [{ kind: 'levelUpSelf' }] }],
        },
      },

      4: {
        store: null,
        combatUnits: null,
        progressMax: 15,
        triggers: {
          onDayPass: [
            {
              do: [
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'threatProgress',
                  delta: 1,
                  chance: 0.3,
                },
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'prosperityProgress',
                  delta: -1,
                  chance: 0.3,
                },
                { kind: 'modifySelfProgress', delta: 1 },
              ],
            },
          ],
          onProgressMax: [{ do: [{ kind: 'levelUpSelf' }] }],
        },
      },

      5: {
        store: null,
        combatUnits: null,
        triggers: {
          onDayPass: [
            {
              do: [
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'threatProgress',
                  delta: 1,
                  chance: 0.6,
                },
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'prosperityProgress',
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

  scavenger_patrol: {
    poiTemplateId: 'scavenger_patrol',
    type: 'encounter',
    faction: 'scavengers',
    perceptionThreshold: 25,
    lifetimeDays: 7,

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
                  cellParam: 'threatProgress',
                  delta: 1,
                  chance: 0.3,
                },
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'prosperityProgress',
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
                  cellParam: 'threatProgress',
                  delta: 1,
                  chance: 0.6,
                },
                {
                  kind: 'changeCurrentCellParam',
                  cellParam: 'prosperityProgress',
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
  // --- Scavenger Settlements ---
  // scavenger_camp: {
  //   id: 'scavenger_camp',
  //   poiTemplateId: 'scavenger_camp',
  //   nameKey: 'poi.scavenger_camp.name',
  //   descriptionKey: 'poi.scavenger_camp.desc',
  //   type: 'settlement',
  //   faction: 'scavengers',
  //   progress: 0,
  //   progressMax: 15,
  //   perceptionThreshold: 15,
  //   triggers: {
  //     onDayPass: [
  //       {
  //         do: [
  //           { kind: 'modifySelfProgress', delta: 1 },
  //           { kind: 'addPoiToCurrentCell', poiId: 'scavenger_group', chance: 0.4 },
  //           { kind: 'changeCurrentCellParam', cellParam: 'threatProgress', delta: 1, chance: 0.3 },
  //           {
  //             kind: 'changeCurrentCellParam',
  //             cellParam: 'prosperityProgress',
  //             delta: -2,
  //             chance: 0.8,
  //           },
  //         ],
  //       },
  //     ],

  //     onProgressMax: [
  //       {
  //         do: [{ kind: 'replaceSelf', toPoiId: 'scavenger_base' }],
  //       },
  //     ],
  //   },
  // },
  // scavenger_base: {
  //   id: 'scavenger_base',
  //   poiTemplateId: 'scavenger_base',
  //   nameKey: 'poi.scavenger_base.name',
  //   descriptionKey: 'poi.scavenger_base.desc',
  //   type: 'settlement',
  //   faction: 'scavengers',
  //   perceptionThreshold: 5,
  //   triggers: {
  //     onDayPass: [
  //       {
  //         do: [
  //           { kind: 'addPoiToCurrentCell', poiId: 'scavenger_patrol', chance: 0.2 },
  //           { kind: 'addPoisInRadius', poiId: 'scavenger_group', radius: 1, perCellChance: 0.3 },
  //           { kind: 'changeCurrentCellParam', cellParam: 'threatProgress', delta: 2, chance: 0.5 },
  //           {
  //             kind: 'changeCurrentCellParam',
  //             cellParam: 'prosperityProgress',
  //             delta: -4,
  //             chance: 0.8,
  //           },
  //           {
  //             kind: 'changeCellParamInRadius',
  //             cellParam: 'threatProgress',
  //             radius: 1,
  //             delta: 1,
  //             perCellChance: 0.3,
  //           },
  //           {
  //             kind: 'changeCellParamInRadius',
  //             cellParam: 'prosperityProgress',
  //             radius: 1,
  //             delta: -1,
  //             perCellChance: 0.6,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // },

  // --- Scavenger Encounters ---
  // scavenger_group: {
  //   id: 'scavenger_group',
  //   poiTemplateId: 'scavenger_group',
  //   nameKey: 'poi.scavenger_group.name',
  //   descriptionKey: 'poi.scavenger_group.desc',
  //   type: 'combat',
  //   faction: 'scavengers',
  //   perceptionThreshold: 25,
  //   duration: 4,
  // },
  // scavenger_patrol: {
  //   id: 'scavenger_patrol',
  //   poiTemplateId: 'scavenger_patrol',
  //   nameKey: 'poi.scavenger_patrol.name',
  //   descriptionKey: 'poi.scavenger_patrol.desc',
  //   type: 'combat',
  //   faction: 'scavengers',
  //   perceptionThreshold: 15,
  //   duration: 4,
  // },

  // --- Loot Locations ---
  // abandoned_car: {
  //   id: 'abandoned_car',
  //   poiTemplateId: 'abandoned_car',
  //   nameKey: 'poi.abandoned_car.name',
  //   descriptionKey: 'poi.abandoned_car.desc',
  //   type: 'loot',
  //   difficulty: 1,
  //   perceptionThreshold: 25,
  //   faction: 'neutral', // Faction is mandatory, so we add a default
  // },
  // crashed_drone: {
  //   id: 'crashed_drone',
  //   poiTemplateId: 'crashed_drone',
  //   nameKey: 'poi.crashed_drone.name',
  //   descriptionKey: 'poi.crashed_drone.desc',
  //   type: 'loot',
  //   difficulty: 2,
  //   perceptionThreshold: 45,
  //   faction: 'neutral',
  // },
  // makeshift_cache: {
  //   id: 'makeshift_cache',
  //   poiTemplateId: 'makeshift_cache',
  //   nameKey: 'poi.makeshift_cache.name',
  //   descriptionKey: 'poi.makeshift_cache.desc',
  //   type: 'loot',
  //   difficulty: 1,
  //   perceptionThreshold: 60,
  //   faction: 'scavengers',
  // },
};
