import type { StoreState } from '@/state/useGameState';
import type { FactionRelation, FactionStatus } from '@/types/factions.types';

import type { GameSlice } from '../types';

const REP_MIN = -100;
const REP_MAX = 100;
const ENEMY_THRESHOLD = -20;
const ALLY_THRESHOLD = 60;
const PLAYER_REPUTATION = 1000;

const calculateStatus = (factionId: string, reputation: number): FactionStatus => {
  if (factionId === 'player') return 'player';
  if (reputation >= ALLY_THRESHOLD) return 'ally';
  if (reputation <= ENEMY_THRESHOLD) return 'enemy';
  return 'neutral';
};

export interface FactionsSlice {
  reputationById: Record<string, number>;
  actions: {
    initializeFactions: (initialData: Record<string, number>) => void;
    changeReputation: (factionId: string, delta: number) => void;
  };
}

export const factionsSelectors = {
  selectFactionRelation:
    (factionId: string) =>
    (state: StoreState): FactionRelation => {
      const reputation = state.factions.reputationById[factionId] ?? 0;
      return {
        reputation,
        status: calculateStatus(factionId, reputation),
      };
    },
  selectStatus:
    (factionId: string) =>
    (state: StoreState): FactionStatus => {
      const reputation = state.factions.reputationById[factionId] ?? 0;
      return calculateStatus(factionId, reputation);
    },
};

export const createFactionsSlice: GameSlice<FactionsSlice> = (set) => ({
  reputationById: {
    player: PLAYER_REPUTATION,
    scavengers: 0,
    mutants: -50,
  },
  actions: {
    initializeFactions: (initialData: Record<string, number>) =>
      set((state) => {
        state.factions.reputationById = initialData;
      }),
    changeReputation: (factionId, delta) =>
      set((state) => {
        if (factionId === 'player') return; // no-op
        const cur = state.factions.reputationById[factionId] ?? 0;
        const next = Math.max(REP_MIN, Math.min(REP_MAX, cur + delta));
        state.factions.reputationById[factionId] = next;
      }),
  },
});
