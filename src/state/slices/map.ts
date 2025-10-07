import type { StoreState } from '@/state/useGameState';
import type { CellLevelKey, CellProgressKey, MapCell } from '@/types/map.types';
import type { PoiType } from '@/types/poi.types';

import type { GameSlice } from '../types';
import { poiSelectors } from './poi';

export const CELL_LEVEL_KEYS: Record<CellProgressKey, CellLevelKey> = {
  threatProgress: 'threatLevel',
  contaminationProgress: 'contaminationLevel',
  prosperityProgress: 'prosperityLevel',
} as const;

const MAX_LEVEL = 9;
const MIN_LEVEL = 0;

const POI_ICON_PRIORITY: Partial<Record<PoiType, number>> = {
  boss: 100,
  quest: 90,
  settlement: 80,
  base: 70,
};

export interface MapSlice {
  selectedCellId: string | null;
  selectedPoiId: string | null;
  cells: Record<string, MapCell>;
  actions: {
    initializeMap: (initialData: Record<string, MapCell>) => void;
    setSelectedCellId: (cellId: string | null) => void;
    clearSelectedCellId: () => void;
    setSelectedPoiId: (poiId: string | null) => void;
    clearSelectedPoiId: () => void;
    exploreCell: (
      cellId: string,
      explorationLevel: number,
      explorationDaysLeft: number | null,
    ) => void;
    modifyCellStatus: (cellId: string, progressKey: CellProgressKey, delta: number) => void;
    processDayEnd: () => void;
  };
}

export const mapSelectors = {
  selectCells: (state: StoreState) => state.map.cells,
  selectCellById: (cellId: string) => (state: StoreState) => state.map.cells[cellId],
  selectCellIcon: (cellId: string) => (state: StoreState) => {
    if (state.party.currentPartyPosition === cellId) return { icon: 'party', faction: 'player' };

    let best = 0;
    let iconData = null;
    const cellPois = poiSelectors.selectVisiblePoisByCellId(cellId)(state);

    if (cellPois?.length) {
      for (const poi of cellPois) {
        const priority = POI_ICON_PRIORITY[poi.type];
        if (!priority) continue;
        if (priority > best) {
          best = priority;
          iconData = { icon: poi.type, faction: poi.faction };
        }
      }
    }
    return iconData;
  },
};

export const createMapSlice: GameSlice<MapSlice> = (set, get) => ({
  selectedCellId: null,
  selectedPoiId: null,
  cells: {},
  actions: {
    initializeMap: (initialData) =>
      set((state) => {
        state.map.cells = initialData;
      }),
    // cell, user selected on the map
    setSelectedCellId: (cellId) =>
      set((state) => {
        state.map.selectedCellId = cellId;
      }),
    clearSelectedCellId: () =>
      set((state) => {
        state.map.selectedCellId = null;
      }),
    setSelectedPoiId: (poiId) =>
      set((state) => {
        state.map.selectedPoiId = poiId;
      }),
    clearSelectedPoiId: () =>
      set((state) => {
        state.map.selectedPoiId = null;
      }),
    exploreCell: (cellId, explorationLevel, explorationDaysLeft) => {
      set((state) => {
        const cell = state.map.cells[cellId];
        cell.isVisited = true;
        cell.explorationLevel =
          cell.explorationLevel < explorationLevel ? explorationLevel : cell.explorationLevel;
        if (cell.explorationDaysLeft !== null) {
          cell.explorationDaysLeft = explorationDaysLeft;
        }
      });
      get().pois.actions.explorePoisInCell(cellId, explorationLevel);
    },
    // threat contamination prosperity
    modifyCellStatus: (cellId, progressKey: CellProgressKey, delta: number) =>
      set((state) => {
        const cell = state.map.cells[cellId];

        const levelKey = CELL_LEVEL_KEYS[progressKey];

        const curLevel = cell[levelKey] as number;
        const curProgress = cell[progressKey] as number;

        const abs = curLevel * 100 + curProgress + delta;
        const absClamped = Math.min(MAX_LEVEL * 100 + 99, Math.max(MIN_LEVEL * 100, abs));

        cell[levelKey] = Math.floor(absClamped / 100) as any;
        cell[progressKey] = (absClamped % 100) as any;
      }),
    processDayEnd: () => {
      set((state) => {
        const partyCellId = state.party.currentPartyPosition;

        Object.values(state.map.cells).forEach((cell) => {
          if (cell.id === partyCellId) return;
          if (cell.explorationDaysLeft != null && cell.explorationDaysLeft > 0) {
            cell.explorationDaysLeft = Math.max(0, cell.explorationDaysLeft - 1);
          }
        });
      });
    },
  },
});
