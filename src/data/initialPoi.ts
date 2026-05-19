import type { InitialPoi } from '@/types/poi';

export const INITIAL_POI: InitialPoi[] = [
  // cells
  {
    id: '2-0',
    type: 'cell',
    parentId: null,
    rootCellId: '2-0',
    details: {
      col: 2,
      row: 0,
      terrain: 'mountain',
      regionParameters: { threat: 105, contamination: 5, prosperity: 20, techLevel: 0 },
    },
  },
  {
    id: '2-1',
    type: 'cell',
    parentId: null,
    rootCellId: '2-1',
    details: {
      col: 2,
      row: 1,
      visitedTimes: 1,
      terrain: 'plain',
      regionParameters: { threat: 105, contamination: 5, prosperity: 20, techLevel: 0 },
    },
  },
  {
    id: '2-2',
    type: 'cell',
    parentId: null,
    rootCellId: '2-2',
    details: {
      col: 2,
      row: 2,
      visitedTimes: 1,
      terrain: 'plain',
      regionParameters: { threat: 105, contamination: 5, prosperity: 20, techLevel: 0 },
    },
  },
  {
    id: '3-0',
    type: 'cell',
    parentId: null,
    rootCellId: '3-0',
    details: {
      col: 3,
      row: 0,
      visitedTimes: 1,
      terrain: 'mountain',
      regionParameters: { threat: 105, contamination: 5, prosperity: 20, techLevel: 0 },
      explorationLevel: 30,
      explorationDaysLeft: Infinity,
    },
  },
  {
    id: '3-1',
    type: 'cell',
    parentId: null,
    rootCellId: '3-1',
    details: {
      col: 3,
      row: 1,
      visitedTimes: 1,
      terrain: 'plain',
      regionParameters: { threat: 105, contamination: 5, prosperity: 20, techLevel: 0 },
      explorationLevel: 30,
      explorationDaysLeft: 3,
    },
  },
  {
    id: '3-2',
    type: 'cell',
    parentId: null,
    rootCellId: '3-2',
    details: {
      col: 3,
      row: 2,
      terrain: 'water',
      regionParameters: { threat: 105, contamination: 5, prosperity: 20, techLevel: 0 },
    },
  },
  {
    id: '4-0',
    type: 'cell',
    parentId: null,
    rootCellId: '4-0',
    details: {
      col: 4,
      row: 0,
      terrain: 'mountain',
      regionParameters: { threat: 105, contamination: 5, prosperity: 20, techLevel: 0 },
    },
  },
  {
    id: '4-1',
    type: 'cell',
    parentId: null,
    rootCellId: '4-1',
    details: {
      col: 4,
      row: 1,
      terrain: 'plain',
      regionParameters: { threat: 105, contamination: 5, prosperity: 20, techLevel: 0 },
    },
  },
  {
    id: '4-2',
    type: 'cell',
    parentId: null,
    rootCellId: '4-2',
    details: {
      col: 4,
      row: 2,
      terrain: 'water',
      regionParameters: { threat: 105, contamination: 5, prosperity: 20, techLevel: 0 },
    },
  },

  // POI

  {
    id: '3-0_encounter_000',
    type: 'scavenger_group',
    parentId: '3-0',
    rootCellId: '3-0',
    details: {
      faction: 'scavengers',
      level: 1,
      isDiscovered: true,
      lifetimeDays: Infinity,
    },
  },

  // Tavern (test facility in cell 3-1)

  {
    id: 'test_tavern',
    type: 'tavern',
    parentId: '3-1',
    rootCellId: '3-1',
    details: {
      isDiscovered: true,
    },
  },
  {
    id: 'test_tavern_bartender_spot',
    type: 'tavern_bartender_spot',
    parentId: 'test_tavern',
    rootCellId: '3-1',
    isLocalSpot: true,
    details: {
      isDiscovered: true,
      requiresOwner: false,
    },
  },
  {
    id: 'test_tavern_waitress_spot',
    type: 'tavern_waitress_spot',
    parentId: 'test_tavern',
    rootCellId: '3-1',
    isLocalSpot: true,
    details: {
      isDiscovered: true,
      requiresOwner: false,
    },
  },
  {
    id: 'test_tavern_free_table',
    type: 'tavern_free_table',
    parentId: 'test_tavern',
    rootCellId: '3-1',
    isLocalSpot: true,
    details: {
      isDiscovered: true,
      requiresOwner: true,
    },
  },
];

