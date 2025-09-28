import type { StoreState } from '@/state/useGameState';
//import { PoisManager } from '@/systems/pois/poisManager';
import type { Poi } from '@/types/poi.type';

import type { GameSlice } from '../types';

export interface PoiSlice {
  poisByCellId: Record<string, Poi[]>;

  actions: {
    initializePois: (initialData: Record<string, Poi[]>) => void;
    addPoiToCell: (cellId: string, poi: Poi) => void;
    removePoiFromCell: (cellId: string, instanceId: string) => void;
  };
}

export const poiSelectors = {
  selectPoisByCellId:
    (cellId: string) =>
    (state: StoreState): Poi[] => {
      return state.pois.poisByCellId[cellId] ?? [];
    },
};

export const createPoiSlice: GameSlice<PoiSlice> = (set, get) => ({
  poisByCellId: {},
  actions: {
    initializePois: (initialData) => {
      console.log(initialData);
      set((state) => {
        state.pois.poisByCellId = initialData;
      });
      console.log(get().pois.poisByCellId);
    },
    addPoiToCell: (cellId, newPoi) => {
      set((state) => {
        const currentPois = state.pois.poisByCellId[cellId] ?? [];

        currentPois.push(newPoi);
        state.pois.poisByCellId[cellId] = currentPois;
      });
    },

    removePoiFromCell: (cellId, poiId) =>
      set((state) => {
        const currentPois = state.pois.poisByCellId[cellId] ?? [];
        state.pois.poisByCellId[cellId] = currentPois.filter((poi) => poi.id !== poiId);
      }),
  },
});
