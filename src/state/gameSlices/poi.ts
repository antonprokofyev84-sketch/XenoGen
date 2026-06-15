import { DEFAULT_EXPLORATION_DURATION, DEFAULT_VISIT_DATE } from '@/constants';
import type { StoreState } from '@/state/useGameState';
import { createPoiFromDescriptor, createPoiFromTemplate } from '@/systems/poi/poiFactory';
import { generatePoiSeedsForCell } from '@/systems/poi/poiSeedGenerator';
import { poiStrategies } from '@/systems/poi/poiStrategies';
import {
  getLocalAreaRootPoiId,
  getLocalNpcIds,
  getLocalPoiIds,
} from '@/systems/poi/poiTreeHelpers';
import { isCell, isNonCell } from '@/types/poi.types';
import type {
  CellPoiNode,
  EffectsMap,
  InitialPoi,
  NonCellNode,
  PoiDetails,
  PoiNode,
} from '@/types/poi.types';
import { diffCalendarDays } from '@/utils/diffCalendarDays';

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
      poiType: string;
      parentId: string;
      detailsOverride?: Partial<PoiDetails>;
    }) => void;
    removePoiWithDependencies: (poiId: string) => void;
    removePoiSubtree: (poiId: string) => void;
    clearAllPois: () => void;
    processDayPass: () => EffectsMap;
    processPoiEnter: (poiId: string) => void;
    exploreCell: (cellId: string, explorationLevel: number, explorationDaysLeft: number) => void;
    modifyCellThreat: (cellId: string, delta: number) => void;
    modifyCellContamination: (cellId: string, delta: number) => void;
    modifyCellProsperity: (cellId: string, delta: number) => void;
    modifyCellTechLevel: (cellId: string, delta: number) => void;
  };
}

// Selectors

export const poiSelectors = {
  selectSelectedPoi: (state: StoreState): PoiNode | null => {
    const selectedPoiId = state.party.currentPartyPosition;
    return state.poiSlice.pois[selectedPoiId] ?? null;
  },
  selectPoiById:
    (poiId: string | null | undefined) =>
    (state: StoreState): PoiNode | null =>
      (poiId ? state.poiSlice.pois[poiId] : null) ?? null,

  selectCellById:
    (poiId: string | null | undefined) =>
    (state: StoreState): CellPoiNode | null => {
      const poi = (poiId ? state.poiSlice.pois[poiId] : null) ?? null;
      return poi && isCell(poi) ? poi : null;
    },

  selectNonCellById:
    (poiId: string | null | undefined) =>
    (state: StoreState): NonCellNode | null => {
      const poi = (poiId ? state.poiSlice.pois[poiId] : null) ?? null;
      return poi && isNonCell(poi) ? poi : null;
    },

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

      return getAllChildPoiIds(node)
        .map((id) => state.poiSlice.pois[id])
        .filter(Boolean);
    },
  selectNestedChildrenOfPoi:
    (poiId: string) =>
    (state: StoreState): PoiNode[] => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return [];

      return node.nestedPoiIds.map((id) => state.poiSlice.pois[id]).filter(Boolean);
    },
  selectLocalSpotChildrenOfPoi:
    (poiId: string) =>
    (state: StoreState): PoiNode[] => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return [];

      return node.localSpotIds.map((id) => state.poiSlice.pois[id]).filter(Boolean);
    },
  selectDiscoveredChildrenOfPoi:
    (poiId: string) =>
    (state: StoreState): NonCellNode[] => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return [];

      return getAllChildPoiIds(node)
        .map((id) => state.poiSlice.pois[id])
        .filter((poi): poi is NonCellNode => !!poi && isNonCell(poi) && poi.details.isDiscovered);
    },
  selectLocalAreaRootPoiId:
    (poiId: string) =>
    (state: StoreState): string =>
      getLocalAreaRootPoiId(poiId, state),
  selectLocalPoiIds:
    (poiId: string) =>
    (state: StoreState): string[] =>
      getLocalPoiIds(poiId, state),
  selectLocalNpcIds:
    (poiId: string) =>
    (state: StoreState): string[] =>
      getLocalNpcIds(poiId, state),
};

// Draft changes

const getAllChildPoiIds = (node: PoiNode): string[] => {
  return [...node.nestedPoiIds, ...node.localSpotIds];
};

const requireCell = (
  poi: PoiNode | null | undefined,
  errorMessage = 'Invalid cell POI ID',
): CellPoiNode => {
  if (!poi || !isCell(poi)) {
    throw new Error(errorMessage);
  }
  return poi;
};

const shouldLinkAsLocalSpot = (node: PoiNode): boolean => {
  return node.isLocalSpot === true;
};

const linkChildToParentDraft = (parent: PoiNode, child: PoiNode) => {
  if (shouldLinkAsLocalSpot(child)) {
    if (!parent.localSpotIds.includes(child.id)) {
      parent.localSpotIds.push(child.id);
    }
    child.isLocalSpot = true;
  } else if (!parent.nestedPoiIds.includes(child.id)) {
    parent.nestedPoiIds.push(child.id);
  }
};

const unlinkChildFromParentDraft = (parent: PoiNode, childId: string) => {
  parent.nestedPoiIds = parent.nestedPoiIds.filter((id) => id !== childId);
  parent.localSpotIds = parent.localSpotIds.filter((id) => id !== childId);
};

const createPoiDraft = ({
  state,
  id,
  poiType,
  parentId,
  detailsOverride,
}: {
  state: StoreState;
  id?: string;
  poiType: string;
  parentId: string;
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
    poiType,
    parentId,
    rootCellId,
    detailsOverride,
  });

  state.poiSlice.pois[node.id] = node;
  linkChildToParentDraft(parent, node);
};

const removePoiSubtreeDraft = (state: StoreState, poiId: string) => {
  removePoiWithDependenciesDraft(state, poiId);
};

const collectPoiSubtreeIdsDraft = (state: StoreState, rootPoiId: string): string[] => {
  const ids: string[] = [];
  const stack = [rootPoiId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    const current = state.poiSlice.pois[currentId];
    if (!current) continue;

    ids.push(currentId);
    stack.push(...getAllChildPoiIds(current));
  }

  return ids;
};

// this should be potentially called from world slice
// i dont like idea to modify multiple slices from the slice differet then world
const clearPoiDependenciesDraft = (state: StoreState, poiId: string) => {
  // Inventory for POI-scoped containers (e.g., generated trader loot)
  delete state.inventory.containers[poiId];

  // Occupancy cleanup for npcId <-> poiId links
  const occupantNpcId = state.occupancySlice.poiOccupants[poiId];
  if (occupantNpcId !== undefined) {
    delete state.occupancySlice.npcLocations[occupantNpcId];
  }
  delete state.occupancySlice.poiOccupants[poiId];

  // Guard/combat cleanup by POI id.
  delete state.guardSlice.guardsByPoiId[poiId];
};

const clearInteractionIfPoiRemovedDraft = (state: StoreState, removedPoiIds: Set<string>) => {
  const current = state.interactionSlice.currentInteraction;
  if (!current) return;

  if (removedPoiIds.has(current.poiId)) {
    state.interactionSlice.currentInteraction = null;
    state.interactionSlice.isTrading = false;
  }
};

// probably this should be done from the world slice
const removePoiWithDependenciesDraft = (state: StoreState, poiId: string) => {
  const { pois } = state.poiSlice;
  const root = pois[poiId];
  if (!root) return;

  // отсоединяем от родителя
  if (root.parentId) {
    const parent = pois[root.parentId];
    if (parent) {
      unlinkChildFromParentDraft(parent, poiId);
    }
  }

  const subtreeIds = collectPoiSubtreeIdsDraft(state, poiId);
  const subtreeSet = new Set(subtreeIds);

  for (const id of subtreeIds) {
    clearPoiDependenciesDraft(state, id);
  }

  clearInteractionIfPoiRemovedDraft(state, subtreeSet);

  for (const id of subtreeIds) {
    delete pois[id];
  }
};

const modifyCellThreatDraft = (state: StoreState, cellId: string, delta: number) => {
  const cellNode = requireCell(state.poiSlice.pois[cellId]);
  const next = Math.max(0, cellNode.details.regionParameters.threat + delta);
  cellNode.details.regionParameters.threat = next;
};

const modifyCellContaminationDraft = (state: StoreState, cellId: string, delta: number) => {
  const cellNode = requireCell(state.poiSlice.pois[cellId]);
  const next = Math.max(0, cellNode.details.regionParameters.contamination + delta);
  cellNode.details.regionParameters.contamination = next;
};

const modifyCellProsperityDraft = (state: StoreState, cellId: string, delta: number) => {
  const cellNode = requireCell(state.poiSlice.pois[cellId]);
  const next = Math.max(0, cellNode.details.regionParameters.prosperity + delta);
  cellNode.details.regionParameters.prosperity = next;
};

const modifyCellTechLevelDraft = (state: StoreState, cellId: string, delta: number) => {
  const cellNode = requireCell(state.poiSlice.pois[cellId]);
  const next = Math.max(0, cellNode.details.regionParameters.techLevel + delta);
  cellNode.details.regionParameters.techLevel = next;
};

const exploreCellDraft = (
  state: StoreState,
  cellId: string,
  explorationLevel: number,
  explorationDaysLeft: number,
) => {
  const cellNode = requireCell(state.poiSlice.pois[cellId]);

  cellNode.details.explorationLevel = Math.max(
    cellNode.details.explorationLevel ?? 0,
    explorationLevel,
  );

  const currentDaysLeft = cellNode.details.explorationDaysLeft ?? 0;
  cellNode.details.explorationDaysLeft = Math.max(currentDaysLeft, explorationDaysLeft);

  // возможно стоит сделать отдельную функцию для исследования POI в ячейке
  for (const poiId of getAllChildPoiIds(cellNode)) {
    const poi = state.poiSlice.pois[poiId];
    if (!poi || !isNonCell(poi)) continue;
    const nonCellPoi = poi;

    if (cellNode.details.explorationLevel >= nonCellPoi.details.explorationThreshold) {
      nonCellPoi.details.isDiscovered = true;
    }
  }
};

const generateCellPoisOnEnterDraft = (state: StoreState, cellId: string, daysPassed: number) => {
  const cell = state.poiSlice.pois[cellId];
  if (!cell || !isCell(cell)) return;

  const childrenCount = getAllChildPoiIds(cell).length;
  if (childrenCount >= MAX_POI_CHILDREN_SOFT_LIMIT) return;
  if (daysPassed <= 0) return;

  const totalToGenerate = Math.floor(Math.random() * (BASE_POI_ROLL_MAX + 1));
  const seeds = generatePoiSeedsForCell({ count: totalToGenerate });

  for (const seed of seeds.slice(0, totalToGenerate)) {
    createPoiDraft({
      state,
      poiType: seed.poiType,
      parentId: cellId,
    });
  }
};

export const getDaysSinceLastVisit = (state: StoreState, poiId: string): number => {
  const poi = state.poiSlice.pois[poiId];
  if (!poi) return 0;

  const previousVisitTime = poi.details.lastTimeVisited ?? DEFAULT_VISIT_DATE;
  return diffCalendarDays(previousVisitTime, state.world.currentTime);
};

const processPoiExitDraft = (state: StoreState, currentPoiId: string, targetPoiId: string) => {
  const currentPoi = state.poiSlice.pois[currentPoiId];
  if (!currentPoi) return;

  const targetPoi = state.poiSlice.pois[targetPoiId];
  const movedIntoOwnLocalSpot =
    targetPoi?.isLocalSpot === true && targetPoi.parentId === currentPoiId;

  currentPoi.details.lastTimeVisited = state.world.currentTime;

  if (!movedIntoOwnLocalSpot) {
    currentPoi.details.visitedTimes = (currentPoi.details.visitedTimes ?? 0) + 1;
  }
};

const processPoiEnterDraft = (state: StoreState, poiId: string, daysPassed: number) => {
  const poi = state.poiSlice.pois[poiId];
  if (!poi) return;

  if (isCell(poi)) {
    generateCellPoisOnEnterDraft(state, poiId, daysPassed);
  }
};

// Expose draft helpers for external systems that operate inside a single `draft` call
export const poiDraft = {
  createPoi: createPoiDraft,
  removePoiWithDependencies: removePoiWithDependenciesDraft,
  removePoiSubtree: removePoiSubtreeDraft,
  modifyCellThreat: modifyCellThreatDraft,
  modifyCellContamination: modifyCellContaminationDraft,
  modifyCellProsperity: modifyCellProsperityDraft,
  modifyCellTechLevel: modifyCellTechLevelDraft,
  exploreCell: exploreCellDraft,
  processPoiEnter: processPoiEnterDraft,
  processPoiExit: processPoiExitDraft,
};

// Slice

export const createPoiSlice: GameSlice<PoiSlice> = (set) => ({
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
          const child = state.poiSlice.pois[entry.id];
          if (parent) {
            if (!child) continue;
            linkChildToParentDraft(parent, child);
          }
        }
      }),

    createPoi: ({ id, poiType, parentId, detailsOverride }) => {
      set((state) => {
        createPoiDraft({
          state,
          id,
          poiType,
          parentId,
          detailsOverride,
        });
      });
    },

    removePoiWithDependencies: (poiId) =>
      set((state) => {
        removePoiWithDependenciesDraft(state, poiId);
      }),

    removePoiSubtree: (poiId) =>
      set((state) => {
        removePoiWithDependenciesDraft(state, poiId);
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

    modifyCellTechLevel: (cellId, delta) => {
      set((state) => {
        modifyCellTechLevelDraft(state, cellId, delta);
      });
    },

    processPoiEnter: (poiId: string) => {
      set((state) => {
        const daysPassed = getDaysSinceLastVisit(state, poiId);
        processPoiEnterDraft(state, poiId, daysPassed);
      });
    },

    processDayPass: () => {
      const allEffects: EffectsMap = {};

      set((state) => {
        const partyPoiId = state.party.currentPartyPosition;
        const partyCellId = state.poiSlice.pois[partyPoiId]?.rootCellId;
        const partyCell = state.poiSlice.pois[partyCellId];
        const partyCellNode = requireCell(partyCell, 'Party location is invalid');

        const { pois } = state.poiSlice;

        for (const poi of Object.values(pois)) {
          const onDayPass = (
            poiStrategies as Record<string, (typeof poiStrategies)[keyof typeof poiStrategies]>
          )[poi.type]?.onDayPass;
          if (!onDayPass) continue;

          const effects = onDayPass(poi);
          if (effects) allEffects[poi.id] = effects;
        }

        partyCellNode.details.explorationDaysLeft = Math.max(
          DEFAULT_EXPLORATION_DURATION,
          (partyCellNode.details.explorationDaysLeft ?? 0) + 1,
        );
      });

      return allEffects;
    },
  },
});
