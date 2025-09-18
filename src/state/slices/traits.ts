import type { GameSlice } from '../types';
import type { StoreState } from '@/state/useGameState';
import { TraitsManager } from '@/systems/traits/traitsManager';
import { TraitsRegistry } from '@/systems/traits/traitsRegistry';
import type { TraitId, ActiveTrait } from '@/types/traits.types';
import { mainStatKeys, skillKeys, secondaryStatsKeys } from '@/state/constants';

const filterModsByKeys = (
  totalMods: Record<string, number>,
  validKeys: string[],
): Record<string, number> => {
  const filteredMods: Record<string, number> = {};
  for (const key of validKeys) {
    if (totalMods[key]) {
      filteredMods[key] = totalMods[key];
    }
  }
  return filteredMods;
};

export interface TraitsSlice {
  traitsByCharacterId: Record<string, ActiveTrait[]>;

  actions: {
    addTraitToCharacter: (characterId: string, traitId: TraitId) => boolean;
    removeTraitFromCharacter: (characterId: string, traitId: TraitId) => void;
    resetCharacterTraits: (characterId: string) => void;
  };
}

export const traitsSelectors = {
  selectTraitsByCharacterId:
    (characterId: string) =>
    (state: StoreState): ActiveTrait[] => {
      return state.traits.traitsByCharacterId[characterId];
    },

  selectTotalModsByCharacterId:
    (characterId: string) =>
    (state: StoreState): Record<string, number> => {
      const active = state.traits.traitsByCharacterId[characterId] ?? [];
      const total: Record<string, number> = {};

      for (const inst of active) {
        const def = TraitsRegistry.getById(inst.id);
        if (!def?.mods) continue;

        for (const [key, val] of Object.entries(def.mods)) {
          total[key] = (total[key] ?? 0) + (val as number);
        }
      }

      return total;
    },

  selectMainStatMods: (characterId: string) => (state: StoreState) => {
    const totalMods = traitsSelectors.selectTotalModsByCharacterId(characterId)(state);
    return filterModsByKeys(totalMods, mainStatKeys);
  },

  selectSkillMods: (characterId: string) => (state: StoreState) => {
    const totalMods = traitsSelectors.selectTotalModsByCharacterId(characterId)(state);
    return filterModsByKeys(totalMods, skillKeys);
  },

  selectSecondaryStatMods: (characterId: string) => (state: StoreState) => {
    const totalMods = traitsSelectors.selectTotalModsByCharacterId(characterId)(state);
    return filterModsByKeys(totalMods, secondaryStatsKeys);
  },
};

export const createTraitsSlice: GameSlice<TraitsSlice> = (set) => ({
  traitsByCharacterId: {},

  actions: {
    addTraitToCharacter: (characterId, traitId) => {
      const def = TraitsRegistry.getById(traitId);
      if (!def) return false;

      set((state) => {
        const currentTraits = state.traits.traitsByCharacterId[characterId] ?? [];
        if (!TraitsManager.canAddTrait(traitId, currentTraits)) {
          return false;
        }

        const { id, duration, progress, group, category, maxCategoryCount, progressMax } = def;
        const newTrait: ActiveTrait = {
          id,
          duration,
          progress: progress,
          group,
          category,
          maxCategoryCount,
          progressMax,
        };
        currentTraits.push(newTrait);
        state.traits.traitsByCharacterId[characterId] = currentTraits;
      });

      return true;
    },

    removeTraitFromCharacter: (characterId, traitId) => {
      set((state) => {
        const list = state.traits.traitsByCharacterId[characterId] ?? [];
        state.traits.traitsByCharacterId[characterId] = list.filter(
          (trait) => trait.id !== traitId,
        );
      });
    },

    resetCharacterTraits: (characterId) => {
      set((state) => {
        state.traits.traitsByCharacterId[characterId] = [];
      });
    },
  },
});
