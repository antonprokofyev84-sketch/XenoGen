import type { StoreState } from '@/state/useGameState';
import type { MapCellState } from '@/types/map.types';
import type { PoiType } from '@/types/poi.type';

import type { GameSlice } from '../types';

const POI_ICON_PRIORITY: Partial<Record<PoiType, number>> = {
  boss: 100,
  quest: 90,
  settlement: 80,
  base: 70,
};

export interface MapSlice {
  cells: Record<string, MapCellState>;
  actions: {
    initializeMap: (initialData: Record<string, MapCellState>) => void;
    updateCell: (cellId: string, updates: Partial<MapCellState>) => void;
    processDayEnd: () => void;
  };
}

export const mapSelectors = {
  selectCells: (state: StoreState) => state.map.cells,
  selectCellById: (cellId: string) => (state: StoreState) => state.map.cells[cellId],
  selectCellIcon: (cellId: string) => (state: StoreState) => {
    if (state.party.currentCellId === cellId) return 'party';

    let best = 0;
    let icon = null;
    const cellPois = state.pois.poisByCellId[cellId];

    if (cellId === '0-3') {
      console.log('---');
      console.log(cellPois);
    }

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
