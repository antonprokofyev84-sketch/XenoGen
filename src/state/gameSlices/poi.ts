import { DEFAULT_EXPLORATION_DURATION, DEFAULT_VISIT_DATE } from '@/constants';
import { INITIAL_CELLS } from '@/data/initial/cells';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import { INITIAL_POIS_BY_CELL } from '@/data/initial/pois';
import type { StoreState } from '@/state/useGameState';
import { clearPoiOccupancy } from '@/systems/npc/slotOccupancy';
import { decreaseWorldDayCounters, runPoiDayPass } from '@/systems/world/dayPass';
import { createInitialWorld } from '@/systems/world/initialWorldFactory';
import { markPoiForRemoval } from '@/systems/world/worldTree';
import type { RegionParameterKey } from '@/types/region.types';
import { REGION_RAW_MAX, REGION_RAW_MIN } from '@/types/region.types';
import type { CellNode, NonCellPoiNode, WorldNode } from '@/types/worldNode.types';
import { isCellNode, isNonCellNode } from '@/types/worldNode.types';
import { diffCalendarDays } from '@/utils/diffCalendarDays';

import type { GameSlice } from '../types';

/**
 * Слайс мира: клетки и POI в одном индексе.
 * Топология определяется через `parentId`, а связи — единственным списком
 * `childPoiIds`. Локальных точек и отдельного дискриминатора `type` больше нет.
 */
export interface PoiSlice {
  pois: Record<string, WorldNode>;

  actions: {
    /** Строит мир из авторских реестров двухпроходной инициализацией. */
    initializeWorld: () => void;
    removePoiWithDependencies: (poiId: string) => void;
    markPoiForRemoval: (poiId: string) => void;
    clearAllPois: () => void;
    /** Дневные эффекты POI, сроки жизни и мировые счётчики дней. */
    runDayPass: () => void;
    /** Единый проход удаления помеченных POI в конце дня. */
    sweepPendingRemovals: () => void;
    processPoiEnter: () => void;
    exploreCell: (cellId: string, explorationLevel: number, explorationDaysLeft: number) => void;
    modifyCellRegionParameter: (cellId: string, param: RegionParameterKey, delta: number) => void;
  };
}

// ============================================================================
// Selectors
// ============================================================================
export const poiSelectors = {
  selectSelectedPoi: (state: StoreState): WorldNode | null => {
    const selectedPoiId = state.party.currentPartyPosition;
    return state.poiSlice.pois[selectedPoiId] ?? null;
  },

  selectPoiById:
    (poiId: string | null | undefined) =>
    (state: StoreState): WorldNode | null =>
      (poiId ? state.poiSlice.pois[poiId] : null) ?? null,

  selectCellById:
    (poiId: string | null | undefined) =>
    (state: StoreState): CellNode | null => {
      const poi = poiId ? state.poiSlice.pois[poiId] : null;
      return poi && isCellNode(poi) ? poi : null;
    },

  selectNonCellById:
    (poiId: string | null | undefined) =>
    (state: StoreState): NonCellPoiNode | null => {
      const poi = poiId ? state.poiSlice.pois[poiId] : null;
      return poi && isNonCellNode(poi) ? poi : null;
    },

  selectParentPoi:
    (poiId: string) =>
    (state: StoreState): WorldNode | null => {
      const node = state.poiSlice.pois[poiId];
      if (!node || node.parentId === null) return null;
      return state.poiSlice.pois[node.parentId] ?? null;
    },

  selectParentCellId:
    (poiId: string) =>
    (state: StoreState): string | null =>
      state.poiSlice.pois[poiId]?.rootCellId ?? null,

  selectParentCellPoi:
    (poiId: string) =>
    (state: StoreState): WorldNode | null => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return null;
      return state.poiSlice.pois[node.rootCellId] ?? null;
    },

  selectChildrenOfPoi:
    (poiId: string) =>
    (state: StoreState): WorldNode[] => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return [];
      return node.childPoiIds.map((id) => state.poiSlice.pois[id]).filter(Boolean);
    },

  selectDiscoveredChildrenOfPoi:
    (poiId: string) =>
    (state: StoreState): NonCellPoiNode[] => {
      const node = state.poiSlice.pois[poiId];
      if (!node) return [];
      return node.childPoiIds
        .map((id) => state.poiSlice.pois[id])
        .filter(
          (poi): poi is NonCellPoiNode =>
            !!poi && isNonCellNode(poi) && poi.details.isDiscovered && !poi.pendingRemoval,
        );
    },
};

// ============================================================================
// Draft helpers
// ============================================================================
const requireCell = (
  poi: WorldNode | null | undefined,
  errorMessage = 'Invalid cell POI ID',
): CellNode => {
  if (!poi || !isCellNode(poi)) {
    throw new Error(errorMessage);
  }
  return poi;
};

const unlinkChildFromParentDraft = (parent: WorldNode, childId: string) => {
  parent.childPoiIds = parent.childPoiIds.filter((id) => id !== childId);
};

const collectPoiSubtreeIdsDraft = (state: StoreState, rootPoiId: string): string[] => {
  const ids: string[] = [];
  const stack = [rootPoiId];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (currentId === undefined) continue;

    const current = state.poiSlice.pois[currentId];
    if (!current) continue;

    ids.push(currentId);
    stack.push(...current.childPoiIds);
  }

  return ids;
};

/**
 * Снимает ссылки на удаляемый POI из других slices.
 * Удаление обязано быть dependency-aware: иначе инвентарь, occupancy и охрана
 * останутся с «висячими» ключами.
 */
const clearPoiDependenciesDraft = (state: StoreState, poiId: string) => {
  delete state.inventory.containers[poiId];
  clearPoiOccupancy(state.occupancySlice, poiId);
  delete state.guardsSlice.guardsByPoiId[poiId];
};

const clearInteractionIfPoiRemovedDraft = (state: StoreState, removedPoiIds: Set<string>) => {
  const current = state.interactionSlice.currentInteraction;
  if (!current) return;

  if (removedPoiIds.has(current.poiId)) {
    state.interactionSlice.currentInteraction = null;
    state.interactionSlice.isTrading = false;
  }
};

const removePoiWithDependenciesDraft = (state: StoreState, poiId: string) => {
  const { pois } = state.poiSlice;
  const root = pois[poiId];
  if (!root) return;

  if (root.parentId !== null) {
    const parent = pois[root.parentId];
    if (parent) {
      unlinkChildFromParentDraft(parent, poiId);
    }
  }

  const subtreeIds = collectPoiSubtreeIdsDraft(state, poiId);

  for (const id of subtreeIds) {
    clearPoiDependenciesDraft(state, id);
  }

  clearInteractionIfPoiRemovedDraft(state, new Set(subtreeIds));

  for (const id of subtreeIds) {
    delete pois[id];
  }
};

/** Изменяет raw-значение региона клетки, удерживая его в диапазоне `0..999`. */
const modifyCellRegionParameterDraft = (
  state: StoreState,
  cellId: string,
  param: RegionParameterKey,
  delta: number,
) => {
  const cellNode = requireCell(state.poiSlice.pois[cellId]);
  const next = cellNode.details.regionParameters[param] + delta;

  cellNode.details.regionParameters[param] = Math.min(
    REGION_RAW_MAX,
    Math.max(REGION_RAW_MIN, next),
  );
};

const exploreCellDraft = (
  state: StoreState,
  cellId: string,
  explorationLevel: number,
  explorationDaysLeft: number,
) => {
  const cellNode = requireCell(state.poiSlice.pois[cellId]);

  cellNode.details.explorationLevel = Math.max(cellNode.details.explorationLevel, explorationLevel);
  cellNode.details.explorationDaysLeft = Math.max(
    cellNode.details.explorationDaysLeft ?? 0,
    explorationDaysLeft,
  );

  for (const poiId of cellNode.childPoiIds) {
    const poi = state.poiSlice.pois[poiId];
    if (!poi || !isNonCellNode(poi)) continue;

    if (poi.details.explorationThreshold <= cellNode.details.explorationLevel) {
      poi.details.isDiscovered = true;
    }
  }
};

export const getDaysSinceLastVisit = (state: StoreState, poiId: string): number => {
  const poi = state.poiSlice.pois[poiId];
  if (!poi) return 0;

  const previousVisitTime = poi.details.lastTimeVisited ?? DEFAULT_VISIT_DATE;
  return diffCalendarDays(previousVisitTime, state.world.currentTime);
};

/**
 * Обновляет счётчики посещения при выходе из POI.
 * `visitedTimes` увеличивается не чаще одного раза за календарный день.
 */
const processPoiExitDraft = (state: StoreState, currentPoiId: string) => {
  const currentPoi = state.poiSlice.pois[currentPoiId];
  if (!currentPoi) return;

  const { lastTimeVisited } = currentPoi.details;
  const isFirstVisitToday =
    lastTimeVisited === null || diffCalendarDays(lastTimeVisited, state.world.currentTime) > 0;

  if (isFirstVisitToday) {
    currentPoi.details.visitedTimes += 1;
  }

  currentPoi.details.lastTimeVisited = state.world.currentTime;
};

/**
 * Обработка входа в POI.
 * Процедурная генерация POI при входе не входит в новый контракт: содержательные
 * события входа обрабатывает очередь Interceptors. Хук сохранён как точка
 * расширения мировой логики входа.
 */
const processPoiEnterDraft = (): void => {};

/**
 * POI-часть дневного тика: дневные эффекты templates, сроки жизни POI и
 * мировые счётчики оставшихся дней.
 * Физическое удаление сюда не входит: истёкшие POI только помечаются,
 * а общий проход удаления выполняется после квестовых таймеров.
 */
const runDayPassDraft = (state: StoreState): void => {
  const partyPoiId = state.party.currentPartyPosition;
  const partyCellId = state.poiSlice.pois[partyPoiId]?.rootCellId;
  const partyCellNode = requireCell(state.poiSlice.pois[partyCellId], 'Party location is invalid');

  runPoiDayPass(state.poiSlice.pois, POI_TEMPLATES);
  decreaseWorldDayCounters(state.poiSlice.pois);

  // Клетка, в которой находится партия, остаётся разведанной.
  partyCellNode.details.explorationDaysLeft = Math.max(
    DEFAULT_EXPLORATION_DURATION,
    partyCellNode.details.explorationDaysLeft ?? 0,
  );
};

/**
 * Единый проход физического удаления помеченных POI.
 * Выполняется один раз в самом конце дня, после остальных дневных систем,
 * и снимает все ссылки на удаляемые узлы, чтобы не осталось висячих ключей.
 */
const sweepPendingRemovalsDraft = (state: StoreState): void => {
  const { pois } = state.poiSlice;
  const markedIds = Object.values(pois)
    .filter((node): node is NonCellPoiNode => isNonCellNode(node) && !!node.pendingRemoval)
    .map((node) => node.id);

  if (markedIds.length === 0) {
    return;
  }

  for (const poiId of markedIds) {
    const node = pois[poiId];
    if (!node) continue;

    if (node.parentId !== null) {
      const parent = pois[node.parentId];
      if (parent) {
        unlinkChildFromParentDraft(parent, poiId);
      }
    }

    clearPoiDependenciesDraft(state, poiId);
  }

  clearInteractionIfPoiRemovedDraft(state, new Set(markedIds));

  for (const poiId of markedIds) {
    delete pois[poiId];
  }
};

/** Draft-операции для систем, работающих внутри одного `set`. */
const initializeWorldDraft = (state: StoreState): void => {
  state.poiSlice.pois = createInitialWorld(INITIAL_CELLS, INITIAL_POIS_BY_CELL, POI_TEMPLATES);
};

export const poiDraft = {
  initializeWorld: initializeWorldDraft,
  removePoiWithDependencies: removePoiWithDependenciesDraft,
  markPoiForRemoval: (state: StoreState, poiId: string) =>
    markPoiForRemoval(state.poiSlice.pois, poiId),
  modifyCellRegionParameter: modifyCellRegionParameterDraft,
  exploreCell: exploreCellDraft,
  processPoiEnter: processPoiEnterDraft,
  processPoiExit: processPoiExitDraft,
  runDayPass: runDayPassDraft,
  sweepPendingRemovals: sweepPendingRemovalsDraft,
};

export const createPoiSlice: GameSlice<PoiSlice> = (set) => ({
  pois: {},

  actions: {
    initializeWorld: () =>
      set((state) => {
        initializeWorldDraft(state);
      }),

    removePoiWithDependencies: (poiId) =>
      set((state) => {
        removePoiWithDependenciesDraft(state, poiId);
      }),

    markPoiForRemoval: (poiId) =>
      set((state) => {
        markPoiForRemoval(state.poiSlice.pois, poiId);
      }),

    clearAllPois: () =>
      set((state) => {
        state.poiSlice.pois = {};
      }),

    exploreCell: (cellId, explorationLevel, explorationDaysLeft) =>
      set((state) => {
        exploreCellDraft(state, cellId, explorationLevel, explorationDaysLeft);
      }),

    modifyCellRegionParameter: (cellId, param, delta) =>
      set((state) => {
        modifyCellRegionParameterDraft(state, cellId, param, delta);
      }),

    processPoiEnter: () =>
      set(() => {
        processPoiEnterDraft();
      }),

    runDayPass: () =>
      set((state) => {
        runDayPassDraft(state);
      }),

    sweepPendingRemovals: () =>
      set((state) => {
        sweepPendingRemovalsDraft(state);
      }),
  },
});
