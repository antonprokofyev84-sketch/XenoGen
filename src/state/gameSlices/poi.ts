import { DEFAULT_EXPLORATION_DURATION } from '@/constants';
import type { StoreState } from '@/state/useGameState';
import {
  createPoiFromDescriptor,
  createPoiFromTemplate,
  resolveEncounterDetails,
} from '@/systems/poi/poiFactory';
import { generatePoiSeedsForCell } from '@/systems/poi/poiSeedGenerator';
import { poiStrategies } from '@/systems/poi/poiStrategies';
import type { NonCellNode, PoiDetails, PoiNode } from '@/types/poi.types';
import type { InitialPoi } from '@/types/poi_initial.types';
import type { EffectsMap } from '@/types/poi_template.types';

import type { GameSlice } from '../types';

// Slice type

const MAX_POI_CHILDREN_SOFT_LIMIT = 6;
const BASE_POI_ROLL_MAX = 2;

export interface PoiSlice {
  pois: Record<string, PoiNode>;

  actions: {
    initializePois: (initial: InitialPoi[]) => void;
    createPoi: (options: {
      id?: string;
      poiTemplateId: string;
      parentId: string;
      level?: number;
      detailsOverride?: Partial<PoiDetails>;
    }) => void;
    removePoiSubtree: (poiId: string) => void;
    clearAllPois: () => void;
    processDayPass: () => EffectsMap;
    processPoiEnter: (poiId: string, daysPassed: number) => void;
    exploreCell: (cellId: string, explorationLevel: number, explorationDaysLeft: number) => void;
    modifyCellThreat: (cellId: string, delta: number) => void;
    modifyCellContamination: (cellId: string, delta: number) => void;
    modifyCellProsperity: (cellId: string, delta: number) => void;
    modifyPoiProgress: (poiId: string, delta: number) => void;
    modifyPoiLevel: (poiId: string, delta: number) => void;
  };
}

// Selectors

export const poiSelectors = {
  selectPoiById:
    (poiId: string) =>
    (state: StoreState): PoiNode | null =>
      state.poiSlice.pois[poiId] ?? null,

  selectParentPoi:
    (poiId: string) =>
    (state: StoreState): PoiNode | null => {
      const node = state.poiSlice.pois[poiId];
      if (!node || !node.parentId) return null;
      return state.poiSlice.pois[node.parentId] ?? null;
    },

  selectParentCellId:
    (poiId: string) =>
    (state: StoreState): string | null => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return null;
      return node.rootCellId;
    },

  selectParrentCellPoi:
    (poiId: string) =>
    (state: StoreState): PoiNode | null => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return null;
      const cellId = node.rootCellId;
      return state.poiSlice.pois[cellId] ?? null;
    },

  selectChildrenOfPoi:
    (poiId: string) =>
    (state: StoreState): PoiNode[] => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return [];

      return node.childrenIds.map((id) => state.poiSlice.pois[id]).filter(Boolean);
    },
  selectDiscoveredChildrenOfPoi:
    (poiId: string) =>
    (state: StoreState): NonCellNode[] => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return [];

      // may be i should add isDiscovered=true to cell poi details too?
      return node.childrenIds
        .map((id) => state.poiSlice.pois[id] as NonCellNode)
        .filter((poi) => poi && poi.details.isDiscovered);
    },
};

// Draft changes

const createPoiDraft = ({
  state,
  id,
  poiTemplateId,
  parentId,
  level,
  detailsOverride,
}: {
  state: StoreState;
  id?: string;
  poiTemplateId: string;
  parentId: string;
  level?: number;
  detailsOverride?: Partial<any>;
}) => {
  const parent = state.poiSlice.pois[parentId];
  if (!parent) {
    throw new Error(`Cannot create POI: parent ${parentId} does not exist`);
  }

  const rootCellId = parent.rootCellId;

  // ВСЯ логика — в фабрике
  const node = createPoiFromTemplate({
    id,
    poiTemplateId,
    parentId,
    rootCellId,
    level,
    detailsOverride,
  });

  state.poiSlice.pois[node.id] = node;
  parent.childrenIds.push(node.id);
};

const removePoiSubtreeDraft = (state: StoreState, poiId: string) => {
  const { pois } = state.poiSlice;
  const root = pois[poiId];
  if (!root) return;

  // отсоединяем от родителя
  if (root.parentId) {
    const parent = pois[root.parentId];
    if (parent) {
      parent.childrenIds = parent.childrenIds.filter((id) => id !== poiId);
    }
  }

  // удаляем всё поддерево
  const stack = [poiId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    const current = pois[currentId];
    if (!current) continue;

    stack.push(...current.childrenIds);
    delete pois[currentId];
  }
};

const modifyCellThreatDraft = (state: StoreState, cellId: string, delta: number) => {
  const cell = state.poiSlice.pois[cellId];
  if (!cell || cell.type !== 'cell') throw new Error('Invalid cell POI ID');
  cell.details.threat = Math.max(0, cell.details.threat + delta);
};

const modifyCellContaminationDraft = (state: StoreState, cellId: string, delta: number) => {
  const cell = state.poiSlice.pois[cellId];
  if (!cell || cell.type !== 'cell') throw new Error('Invalid cell POI ID');
  cell.details.contamination = Math.max(0, cell.details.contamination + delta);
};

const modifyCellProsperityDraft = (state: StoreState, cellId: string, delta: number) => {
  const cell = state.poiSlice.pois[cellId];
  if (!cell || cell.type !== 'cell') throw new Error('Invalid cell POI ID');
  cell.details.prosperity = Math.max(0, cell.details.prosperity + delta);
};

const exploreCellDraft = (
  state: StoreState,
  cellId: string,
  explorationLevel: number,
  explorationDaysLeft: number,
) => {
  const cell = state.poiSlice.pois[cellId];
  if (!cell || cell.type !== 'cell') {
    throw new Error('Invalid cell POI ID');
  }

  cell.details.explorationLevel = Math.max(cell.details.explorationLevel ?? 0, explorationLevel);

  const currentDaysLeft = cell.details.explorationDaysLeft ?? 0;
  cell.details.explorationDaysLeft = Math.max(currentDaysLeft, explorationDaysLeft);

  // возможно стоит сделать отдельную функцию для исследования POI в ячейке
  for (const poiId of cell.childrenIds) {
    const poi = state.poiSlice.pois[poiId];
    if (!poi || poi.type === 'cell') continue;

    if (cell.details.explorationLevel >= poi.details.explorationThreshold) {
      poi.details.isDiscovered = true;
    }
  }
};

const modifyPoiProgressDraft = (state: StoreState, poiId: string, delta: number) => {
  const poi = state.poiSlice.pois[poiId];
  if (!poi || poi.type !== 'encounter') {
    //in future support other types
    throw new Error('Invalid poi type for progress modification');
  }
  if (!poi.details.progressMax) {
    throw new Error('POI does not have progressMax defined');
  }

  poi.details.progress = (poi.details.progress ?? 0) + delta;

  if (poi.details.progress < 0) {
    poi.details.progress = 0;
    modifyPoiLevelDraft(state, poiId, -1);
  }
  if (poi.details.progress > poi.details.progressMax) {
    poi.details.progress = 0;
    modifyPoiLevelDraft(state, poiId, 1);
  }
};

const modifyPoiLevelDraft = (state: StoreState, poiId: string, delta: number) => {
  const poi = state.poiSlice.pois[poiId];
  if (!poi || poi.type !== 'encounter') {
    //in future support other types
    throw new Error('Invalid poi type for progress modification');
  }
  const poiDetails = poi.details;
  const newLevel = (poiDetails.level ?? 0) + delta;
  const newDetails = resolveEncounterDetails({
    poiTemplateId: poiDetails.poiTemplateId,
    level: newLevel,
    detailsOverride: {},
    detailsBase: poiDetails,
  });

  poi.details = newDetails;
};

const processPoiEnterDraft = (
  state: StoreState,
  poiId: string,
  daysPassed: number,
  currentTime: number,
) => {
  const poi = state.poiSlice.pois[poiId];
  const childrenCount = poi.childrenIds.length;
  if (!poi || poi.type !== 'cell') return;
  if (childrenCount >= MAX_POI_CHILDREN_SOFT_LIMIT) return;
  if (daysPassed <= 0) return;

  const totalToGenerate = Math.floor(Math.random() * (BASE_POI_ROLL_MAX + 1));

  const seeds = generatePoiSeedsForCell({
    cellDetails: poi.details,
    count: totalToGenerate,
  });

  for (const seed of seeds.slice(0, totalToGenerate)) {
    createPoiDraft({
      state,
      poiTemplateId: seed.poiTemplateId,
      parentId: poiId,
      level: seed.level,
    });
  }

  poi.details.lastTimeVisited = currentTime;
  poi.details.visitedTimes += 1;
};

// Expose draft helpers for external systems that operate inside a single `draft` call
export const poiDraft = {
  createPoi: createPoiDraft,
  removePoiSubtree: removePoiSubtreeDraft,
  modifyCellThreat: modifyCellThreatDraft,
  modifyCellContamination: modifyCellContaminationDraft,
  modifyCellProsperity: modifyCellProsperityDraft,
  exploreCell: exploreCellDraft,
  modifyPoiProgress: modifyPoiProgressDraft,
  modifyPoiLevel: modifyPoiLevelDraft,
  processPoiEnter: processPoiEnterDraft,
};

// Slice

export const createPoiSlice: GameSlice<PoiSlice> = (set, get) => ({
  pois: {},

  actions: {
    initializePois: (initial) =>
      set((state) => {
        state.poiSlice.pois = {};

        for (const entry of initial) {
          state.poiSlice.pois[entry.id] = createPoiFromDescriptor(entry);
        }

        for (const entry of initial) {
          if (!entry.parentId) continue;

          const parent = state.poiSlice.pois[entry.parentId];
          if (parent) {
            parent.childrenIds.push(entry.id);
          }
        }
      }),

    createPoi: ({ id, poiTemplateId, parentId, level, detailsOverride }) => {
      set((state) => {
        createPoiDraft({
          state,
          id,
          poiTemplateId,
          parentId,
          level,
          detailsOverride,
        });
      });
    },

    removePoiSubtree: (poiId) =>
      set((state) => {
        removePoiSubtreeDraft(state, poiId);
      }),

    clearAllPois: () =>
      set((state) => {
        state.poiSlice.pois = {};
      }),

    exploreCell: (cellId, explorationLevel, explorationDaysLeft) => {
      set((state) => {
        exploreCellDraft(state, cellId, explorationLevel, explorationDaysLeft);
      });
    },

    modifyCellThreat: (cellId, delta) => {
      set((state) => {
        modifyCellThreatDraft(state, cellId, delta);
      });
    },

    modifyCellContamination: (cellId, delta) => {
      set((state) => {
        modifyCellContaminationDraft(state, cellId, delta);
      });
    },

    modifyCellProsperity: (cellId, delta) => {
      set((state) => {
        modifyCellProsperityDraft(state, cellId, delta);
      });
    },

    modifyPoiProgress: (poiId, delta) => {
      set((state) => {
        modifyPoiProgressDraft(state, poiId, delta);
      });
    },

    modifyPoiLevel: (poiId, delta) => {
      set((state) => {
        modifyPoiLevelDraft(state, poiId, delta);
      });
    },

    processPoiEnter: (poiId: string, daysPassed: number) => {
      const currentTime = get().world.currentTime;
      set((state) => {
        processPoiEnterDraft(state, poiId, daysPassed, currentTime);
      });
    },

    processDayPass: () => {
      const allEffects: EffectsMap = {};

      set((state) => {
        const partyPoiId = state.party.currentPartyPosition;
        const partyCellId = state.poiSlice.pois[partyPoiId]?.rootCellId;
        const partyCell = state.poiSlice.pois[partyCellId];
        if (!partyCell || partyCell.type !== 'cell') {
          throw new Error('Party location is invalid');
        }

        const { pois } = state.poiSlice;

        for (const poi of Object.values(pois)) {
          const onDayPass = poiStrategies[poi.type]?.onDayPass;
          if (!onDayPass) continue;

          const effects = onDayPass(poi);
          if (effects) allEffects[poi.id] = effects;
        }

        partyCell.details.explorationDaysLeft = Math.max(
          DEFAULT_EXPLORATION_DURATION,
          (partyCell.details.explorationDaysLeft ?? 0) + 1,
        );
      });

      return allEffects;
    },
  },
});
