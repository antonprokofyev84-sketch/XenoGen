import { EffectManager } from '@/systems/effects/effectManager';

import type { GameSlice } from '../types';

export interface WorldSlice {
  currentDay: number;
  actions: {
    endDay: () => void;
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
      // get one snapshot for all effects checks
      const stateSnapshot = get();

      const traitsEffects = get().traits.actions.processDayEnd();
      get().map.actions.processDayEnd();

      EffectManager.processEffects(traitsEffects, { state: stateSnapshot });
      console.log('---');
      console.log(get().traits.traitsByCharacterId);
      console.log(get().characters.byId['protagonist'].mainStats);
    },
  },
});
