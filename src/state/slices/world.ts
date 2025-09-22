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

      get().traits.actions.processDayEnd();
    },
  },
});
