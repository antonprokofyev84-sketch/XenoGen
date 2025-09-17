import type { GameSlice } from '../types';
import type { StoreState } from '@/state/useGameState';
import { TRAITS_DB } from '@/data/traits';

// Типы (минимум, под задачу)
export type TraitId = string;

export interface TraitsSlice {
  // где: ключ — id персонажа; значение — список id-трейтов на нём
  traitsByCharacterId: Record<string, TraitId[]>;

  actions: {
    addTraitToCharacter: (characterId: string, traitId: TraitId) => boolean;
    // на будущее (удобно иметь):
    removeTraitFromCharacter: (characterId: string, traitId: TraitId) => void;
  };
}

export const traitsSelectors = {
  selectTraitsByCharacterId:
    (characterId: string) =>
    (state: StoreState): TraitId[] => {
      return state.traits.traitsByCharacterId[characterId];
    },
};

// Быстрый реестр по id, чтобы смотреть group/category и т.д.
const traitById: Record<string, any> = {};
for (const t of TRAITS_DB) traitById[t.id] = t;

export const createTraitsSlice: GameSlice<TraitsSlice> = (set, get) => ({
  traitsByCharacterId: {},

  actions: {
    addTraitToCharacter: (characterId, traitId) => {
      const def = traitById[traitId];
      if (!def) return false;

      // NB: мы мутируем через immer — всё ок
      set((state) => {
        const list = state.traits.traitsByCharacterId[characterId] ?? [];

        // уже есть — ничего не делаем
        if (list.includes(traitId)) return;

        // 1) Взаимоисключение по group (например, alcoholism уровнями)
        if (def.group) {
          // сносим все трейты из той же group
          const toKeep = list.filter((id) => {
            const d = traitById[id];
            return !d?.group || d.group !== def.group;
          });
          state.traits.traitsByCharacterId[characterId] = toKeep;
        }

        // 2) Лимит по категории (например, profession ≤ 2)
        if (def.category && def.maxCategoryCount) {
          const current = (state.traits.traitsByCharacterId[characterId] ?? []).filter(
            (id) => traitById[id]?.category === def.category,
          );
          if (current.length >= def.maxCategoryCount) {
            // не влезает — просто выходим без добавления
            return;
          }
        }

        // 3) Добавляем
        const updated = state.traits.traitsByCharacterId[characterId] ?? [];
        updated.push(traitId);
        state.traits.traitsByCharacterId[characterId] = updated;
      });

      return true;
    },

    removeTraitFromCharacter: (characterId, traitId) => {
      set((state) => {
        const list = state.traits.traitsByCharacterId[characterId] ?? [];
        state.traits.traitsByCharacterId[characterId] = list.filter((id) => id !== traitId);
      });
    },
  },
});
