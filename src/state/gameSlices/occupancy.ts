import type { StoreState } from '@/state/useGameState';
import type { OccupancyState } from '@/types/occupancy.types';

import type { GameSlice } from '../types';

export interface OccupancySlice extends OccupancyState {
  actions: {
    clearAllOccupancy: () => void;
    assignNpcToPoi: (npcId: string, poiId: string) => void;
    clearNpcOccupancy: (npcId: string) => void;
    clearPoiOccupancy: (poiId: string) => void;
    replaceOccupancyState: (occupancyState: OccupancyState) => void;
  };
}

export const occupancySelectors = {
  selectNpcLocation:
    (npcId: string) =>
    (state: StoreState): string | undefined =>
      state.occupancySlice.npcLocations[npcId],

  selectPoiOccupant:
    (poiId: string) =>
    (state: StoreState): string | undefined =>
      state.occupancySlice.poiOccupants[poiId],

  selectIsNpcPlaced:
    (npcId: string) =>
    (state: StoreState): boolean =>
      state.occupancySlice.npcLocations[npcId] !== undefined,

  selectIsPoiOccupied:
    (poiId: string) =>
    (state: StoreState): boolean =>
      state.occupancySlice.poiOccupants[poiId] !== undefined,
};

const clearAllOccupancyDraft = (state: StoreState) => {
  state.occupancySlice.npcLocations = {};
  state.occupancySlice.poiOccupants = {};
};

const assignNpcToPoiDraft = (state: StoreState, npcId: string, poiId: string) => {
  const previousPoiId = state.occupancySlice.npcLocations[npcId];
  if (previousPoiId !== undefined) {
    delete state.occupancySlice.poiOccupants[previousPoiId];
  }

  const previousNpcId = state.occupancySlice.poiOccupants[poiId];
  if (previousNpcId !== undefined) {
    delete state.occupancySlice.npcLocations[previousNpcId];
  }

  state.occupancySlice.npcLocations[npcId] = poiId;
  state.occupancySlice.poiOccupants[poiId] = npcId;
};

const clearNpcOccupancyDraft = (state: StoreState, npcId: string) => {
  const poiId = state.occupancySlice.npcLocations[npcId];
  if (poiId !== undefined) {
    delete state.occupancySlice.poiOccupants[poiId];
  }
  delete state.occupancySlice.npcLocations[npcId];
};

const clearPoiOccupancyDraft = (state: StoreState, poiId: string) => {
  const npcId = state.occupancySlice.poiOccupants[poiId];
  if (npcId !== undefined) {
    delete state.occupancySlice.npcLocations[npcId];
  }
  delete state.occupancySlice.poiOccupants[poiId];
};

const replaceOccupancyStateDraft = (state: StoreState, occupancyState: OccupancyState) => {
  state.occupancySlice.npcLocations = { ...occupancyState.npcLocations };
  state.occupancySlice.poiOccupants = { ...occupancyState.poiOccupants };
};

export const occupancyDraft = {
  clearAllOccupancy: clearAllOccupancyDraft,
  assignNpcToPoi: assignNpcToPoiDraft,
  clearNpcOccupancy: clearNpcOccupancyDraft,
  clearPoiOccupancy: clearPoiOccupancyDraft,
  replaceOccupancyState: replaceOccupancyStateDraft,
};

export const createOccupancySlice: GameSlice<OccupancySlice> = (set) => ({
  npcLocations: {},
  poiOccupants: {},
  actions: {
    clearAllOccupancy: () =>
      set((state) => {
        clearAllOccupancyDraft(state);
      }),

    assignNpcToPoi: (npcId, poiId) =>
      set((state) => {
        assignNpcToPoiDraft(state, npcId, poiId);
      }),

    clearNpcOccupancy: (npcId) =>
      set((state) => {
        clearNpcOccupancyDraft(state, npcId);
      }),

    clearPoiOccupancy: (poiId) =>
      set((state) => {
        clearPoiOccupancyDraft(state, poiId);
      }),

    replaceOccupancyState: (occupancyState) =>
      set((state) => {
        replaceOccupancyStateDraft(state, occupancyState);
      }),
  },
});
