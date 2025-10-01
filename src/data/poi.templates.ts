import type { Poi } from '@/types/poi.types';

export const POI_TEMPLATES_DB: Record<string, Partial<Poi>> = {
  // --- Scavenger Settlements ---
  scavenger_camp: {
    id: 'scavenger_camp',
    poiTemplateId: 'scavenger_camp',
    nameKey: 'poi.scavenger_camp.name',
    descriptionKey: 'poi.scavenger_camp.desc',
    type: 'settlement',
    faction: 'scavengers',
    progress: 0,
    progressMax: 15,
    perceptionThreshold: 15,
    triggers: {
      onDayPass: [
        {
          do: [
            { kind: 'modifySelfProgress', delta: 1 },
            { kind: 'addPoiToCurrentCell', poiId: 'scavenger_group', chance: 0.4 },
            { kind: 'changeCurrentCellParam', cellParam: 'threatProgress', delta: 1, chance: 0.3 },
            {
              kind: 'changeCurrentCellParam',
              cellParam: 'prosperityProgress',
              delta: -2,
              chance: 0.8,
            },
          ],
        },
      ],

      onProgressMax: [
        {
          do: [{ kind: 'replaceSelf', toPoiId: 'scavenger_base' }],
        },
      ],
    },
  },
  scavenger_base: {
    id: 'scavenger_base',
    poiTemplateId: 'scavenger_base',
    nameKey: 'poi.scavenger_base.name',
    descriptionKey: 'poi.scavenger_base.desc',
    type: 'settlement',
    faction: 'scavengers',
    perceptionThreshold: 5,
    triggers: {
      onDayPass: [
        {
          do: [
            { kind: 'addPoiToCurrentCell', poiId: 'scavenger_patrol', chance: 0.2 },
            { kind: 'addPoisInRadius', poiId: 'scavenger_group', radius: 1, perCellChance: 0.3 },
            { kind: 'changeCurrentCellParam', cellParam: 'threatProgress', delta: 2, chance: 0.5 },
            {
              kind: 'changeCurrentCellParam',
              cellParam: 'prosperityProgress',
              delta: -4,
              chance: 0.8,
            },
            {
              kind: 'changeCellParamInRadius',
              cellParam: 'threatProgress',
              radius: 1,
              delta: 1,
              perCellChance: 0.3,
            },
            {
              kind: 'changeCellParamInRadius',
              cellParam: 'prosperityProgress',
              radius: 1,
              delta: -1,
              perCellChance: 0.6,
            },
          ],
        },
      ],
    },
  },

  // --- Scavenger Encounters ---
  scavenger_group: {
    id: 'scavenger_group',
    poiTemplateId: 'scavenger_group',
    nameKey: 'poi.scavenger_group.name',
    descriptionKey: 'poi.scavenger_group.desc',
    type: 'battle',
    faction: 'scavengers',
    perceptionThreshold: 25,
    duration: 4,
  },
  scavenger_patrol: {
    id: 'scavenger_patrol',
    poiTemplateId: 'scavenger_patrol',
    nameKey: 'poi.scavenger_patrol.name',
    descriptionKey: 'poi.scavenger_patrol.desc',
    type: 'battle',
    faction: 'scavengers',
    perceptionThreshold: 15,
    duration: 4,
  },

  // --- Loot Locations ---
  abandoned_car: {
    id: 'abandoned_car',
    poiTemplateId: 'abandoned_car',
    nameKey: 'poi.abandoned_car.name',
    descriptionKey: 'poi.abandoned_car.desc',
    type: 'loot',
    difficulty: 1,
    perceptionThreshold: 25,
    faction: 'neutral', // Faction is mandatory, so we add a default
  },
  crashed_drone: {
    id: 'crashed_drone',
    poiTemplateId: 'crashed_drone',
    nameKey: 'poi.crashed_drone.name',
    descriptionKey: 'poi.crashed_drone.desc',
    type: 'loot',
    difficulty: 2,
    perceptionThreshold: 45,
    faction: 'neutral',
  },
  makeshift_cache: {
    id: 'makeshift_cache',
    poiTemplateId: 'makeshift_cache',
    nameKey: 'poi.makeshift_cache.name',
    descriptionKey: 'poi.makeshift_cache.desc',
    type: 'loot',
    difficulty: 1,
    perceptionThreshold: 60,
    faction: 'scavengers',
  },
};
