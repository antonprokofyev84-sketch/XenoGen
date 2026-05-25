import type { CombatUnit } from '@/types/combat.types';

import type { GameSlice } from '../types';
import type { StoreState } from '../useGameState';

export interface GuardSlice {
  guardsByPoiId: Record<string, CombatUnit[]>;
  actions: {
    setGuardByPoiId: (poiId: string, units: CombatUnit[]) => void;
    clearGuardByPoiId: (poiId: string) => void;
    clearAllGuards: () => void;
  };
}

export const guardSelectors = {
  selectGuardByPoiId:
    (poiId: string) =>
    (state: StoreState): CombatUnit[] =>
      state.guardSlice.guardsByPoiId[poiId] ?? [],
};

const setGuardByPoiIdDraft = (state: StoreState, poiId: string, units: CombatUnit[]) => {
  state.guardSlice.guardsByPoiId[poiId] = units;
};

const clearGuardByPoiIdDraft = (state: StoreState, poiId: string) => {
  delete state.guardSlice.guardsByPoiId[poiId];
};

const clearAllGuardsDraft = (state: StoreState) => {
  state.guardSlice.guardsByPoiId = {};
};

export const guardDraft = {
  setGuardByPoiId: setGuardByPoiIdDraft,
  clearGuardByPoiId: clearGuardByPoiIdDraft,
  clearAllGuards: clearAllGuardsDraft,
};

export const createGuardSlice: GameSlice<GuardSlice> = (set) => ({
  guardsByPoiId: {},
  actions: {
    setGuardByPoiId: (poiId, units) =>
      set((state) => {
        setGuardByPoiIdDraft(state, poiId, units);
      }),

    clearGuardByPoiId: (poiId) =>
      set((state) => {
        clearGuardByPoiIdDraft(state, poiId);
      }),

    clearAllGuards: () =>
      set((state) => {
        clearAllGuardsDraft(state);
      }),
  },
});
