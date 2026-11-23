import { DEFAULT_EXPLORATION_DURATION, DEFAULT_VISIT_DATE } from '@/constants';
import { INITIAL_CELLS } from '@/data/initial/cells';
import { POI_TEMPLATES } from '@/data/initial/poiTemplates';
import { INITIAL_POIS_BY_CELL } from '@/data/initial/pois';
import type { StoreState } from '@/state/useGameState';
import { finishInteractionStep } from '@/systems/interaction/interactionState';
import { clearPoiOccupancy } from '@/systems/npc/slotOccupancy';
import { decreaseWorldDayCounters, runPoiDayPass } from '@/systems/world/dayPass';
import { createInitialWorld } from '@/systems/world/initialWorldFactory';
import { collectAncestorIds, markPoiForRemoval } from '@/systems/world/worldTree';
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
    markPoiForRemoval: (poiId: string) => void;
    clearAllPois: () => void;
    /** Дневные эффекты POI, сроки жизни и мировые счётчики дней. */
    runDayPass: () => void;
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

/**
 * Снимает ссылки на удаляемый POI из других slices.
 * Удаление обязано быть dependency-aware: иначе инвентарь, occupancy и охрана
 * останутся с «висячими» ключами.
 */
const clearPoiDependenciesDraft = (state: StoreState, poiId: string) => {
  delete state.inventory.containers[poiId];
  clearPoiOccupancy(state.occupancySlice, poiId);
  delete state.guardSlice.guardsByPoiId[poiId];
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

export const getCurrentPoiDaysSinceLastVisit = (state: StoreState): number => {
  const poi = state.poiSlice.pois[state.party.currentPartyPosition];
  const previousVisitTime = poi.details.lastTimeVisited ?? DEFAULT_VISIT_DATE;
  return diffCalendarDays(previousVisitTime, state.world.currentTime);
};

/**
 * Обновляет счётчики посещения при выходе из POI.
 * `visitedTimes` увеличивается не чаще одного раза за календарный день.
 */
const processCurrentPoiExitDraft = (state: StoreState) => {
  const currentPoi = state.poiSlice.pois[state.party.currentPartyPosition];

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
 * а общий проход удаления выполняется после квестовых таймеров этого же цикла.
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
 * Выполняется после дневных effects и таймеров для всех помеченных POI
 * и снимает все ссылки на удаляемые узлы, чтобы не осталось висячих ключей.
 */
const sweepPendingRemovalsDraft = (state: StoreState): void => {
  const { pois } = state.poiSlice;
  const partyPoiId = state.party.currentPartyPosition;
  // Сохраняем занятое место вместе с путём, по которому партия сможет выйти.
  const protectedIds = new Set([partyPoiId, ...collectAncestorIds(pois, partyPoiId)]);
  const markedIds = Object.values(pois)
    .filter(
      (node): node is NonCellPoiNode =>
        isNonCellNode(node) && !!node.pendingRemoval && !protectedIds.has(node.id),
    )
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
  markPoiForRemoval: (state: StoreState, poiId: string) =>
    markPoiForRemoval(state.poiSlice.pois, poiId),
  modifyCellRegionParameter: modifyCellRegionParameterDraft,
  exploreCell: exploreCellDraft,
  processPoiEnter: processPoiEnterDraft,
  processCurrentPoiExit: processCurrentPoiExitDraft,
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

    markPoiForRemoval: (poiId) =>
      set((state) => {
        markPoiForRemoval(state.poiSlice.pois, poiId);
        finishInteractionStep(state);
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
        finishInteractionStep(state);
      }),
  },
});
