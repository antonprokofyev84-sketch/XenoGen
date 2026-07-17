import type { StatsSliceState } from '@/types/statsSlice.types';

import type { GameSlice } from '../types';
import type { StoreState } from '../useGameState';

function recordDefeatDraft(
  combat: StatsSliceState['combat'],
  enemyTypeId: string,
  count: number,
): void {
  const currentValue = combat.defeated[enemyTypeId] ?? 0;
  combat.defeated[enemyTypeId] = currentValue + count;
}

function resetCombatStatsDraft(combat: StatsSliceState['combat']): void {
  combat.defeated = {};
}

export interface StatsSlice extends StatsSliceState {
  actions: {
    recordDefeat: (enemyTypeId: string, count?: number) => void;
    resetCombatStats: () => void;
  };
}

export const statsSelectors = {
  selectCombatStats: (state: StoreState) => state.statsSlice.combat,

  selectDefeatedByEnemyType:
    (enemyTypeId: string) =>
    (state: StoreState): number =>
      state.statsSlice.combat.defeated[enemyTypeId] ?? 0,
};

export const createStatsSlice: GameSlice<StatsSlice> = (set) => ({
  combat: {
    defeated: {},
  },

  actions: {
    recordDefeat: (enemyTypeId, count = 1) => {
      set((state) => {
        recordDefeatDraft(state.statsSlice.combat, enemyTypeId, count);
      });
    },

    resetCombatStats: () => {
      set((state) => {
        resetCombatStatsDraft(state.statsSlice.combat);
      });
    },
  },
});
