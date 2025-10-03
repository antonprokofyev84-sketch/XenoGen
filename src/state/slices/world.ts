import { DEFAULT_EXPLORATION_DURATION } from '@/constants';
import { EffectManager } from '@/systems/effects/effectManager';

import type { GameSlice } from '../types';
import { partySelectors } from '../useGameState';

export interface WorldSlice {
  currentDay: number;
  actions: {
    endDay: () => void;
    scoutCell: (cellId: string, maxRollValue: number, bonus: number, duration: number) => void;
    travelToCell: (targetCellId: string) => void;
  };
}

export const createWorldSlice: GameSlice<WorldSlice> = (set, get) => ({
  currentDay: 0,
  actions: {
    endDay: () => {
      set((state) => {
        state.world.currentDay += 1;
      });

      console.log(`--- Day ${get().world.currentDay} has begun ---`);
      const stateSnapshot = get();

      const traitEffects = get().traits.actions.processDayEnd();
      get().map.actions.processDayEnd();
      const poiEffects = get().pois.actions.processDayEnd();

      EffectManager.processTraitEffects(traitEffects, { state: stateSnapshot });
      EffectManager.processPoiEffects(poiEffects, { state: stateSnapshot });
    },

    scoutCell: (cellId, maxRollValue, bonus, duration) => {
      const roll = Math.floor(Math.random() * (maxRollValue + 1));
      const explorationLevel = roll + bonus;

      get().map.actions.exploreCell(cellId, explorationLevel, duration);
    },

    travelToCell: (targetCellId: string) => {
      set((state) => {
        state.party.previousPartyPosition = state.party.currentPartyPosition;
        state.party.currentPartyPosition = targetCellId;
      });

      const selectedStat = partySelectors.selectHighestEffectiveMainStat('per')(get());
      get().world.actions.scoutCell(targetCellId, selectedStat, 0, DEFAULT_EXPLORATION_DURATION);
    },
  },
});
