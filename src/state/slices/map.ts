import type { StoreState } from '@/state/useGameState';
import type { MapCell } from '@/types/map.types';
import type { PoiType } from '@/types/poi.types';

import type { GameSlice } from '../types';

const POI_ICON_PRIORITY: Partial<Record<PoiType, number>> = {
  boss: 100,
  quest: 90,
  settlement: 80,
  base: 70,
};

export interface MapSlice {
  selectedCellId: string | null;
  cells: Record<string, MapCell>;
  actions: {
    initializeMap: (initialData: Record<string, MapCell>) => void;
    updateCell: (cellId: string, updates: Partial<MapCell>) => void;
    updateSelectedCellId: (cellId: string | null) => void;
    clearSelectedCellId: () => void;
    processDayEnd: () => void;
  };
}

export const mapSelectors = {
  selectSelectedCellId: (state: StoreState) => state.map.selectedCellId,
  selectCells: (state: StoreState) => state.map.cells,
  selectCellById: (cellId: string) => (state: StoreState) => state.map.cells[cellId],
  selectCellIcon: (cellId: string) => (state: StoreState) => {
    if (state.party.currentCellId === cellId) return 'party';

    let best = 0;
    let icon = null;
    const cellPois = state.pois.poisByCellId[cellId];

    if (cellPois?.length) {
      for (const poi of cellPois) {
        const priority = POI_ICON_PRIORITY[poi.type];
        if (!priority) continue;
        if (priority > best) {
          best = priority;
          icon = poi.type;
        }
      }
    }
    return icon;
  },
};

export const createMapSlice: GameSlice<MapSlice> = (set) => ({
  selectedCellId: null,
  cells: {},
  actions: {
    initializeMap: (initialData) =>
      set((state) => {
        state.map.cells = initialData;
      }),
    updateCell: (cellId, updates) =>
      set((state) => {
        if (state.map.cells[cellId]) {
          state.map.cells[cellId] = { ...state.map.cells[cellId], ...updates };
        }
      }),
    updateSelectedCellId: (cellId) =>
      set((state) => {
        state.map.selectedCellId = cellId;
      }),
    clearSelectedCellId: () =>
      set((state) => {
        state.map.selectedCellId = null;
      }),
    processDayEnd: () => {
      set((state) => {
        Object.values(state.map.cells).forEach((cell) => {
          if (cell.explorationDaysLeft != null && cell.explorationDaysLeft > 0) {
            cell.explorationDaysLeft = Math.max(0, cell.explorationDaysLeft - 1);
          }
        });
      });
    },
  },
});
