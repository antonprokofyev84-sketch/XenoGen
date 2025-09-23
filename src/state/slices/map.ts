import type { GameSlice } from '../types';
import type { StoreState } from '@/state/useGameState';
import type { MapCellState } from '@/types/map.types';

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
