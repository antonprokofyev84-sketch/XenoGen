import type { StoreState } from '@/state/useGameState';
import { traitsManager } from '@/systems/traits/traitsManager';
import { traitsRegistry } from '@/systems/traits/traitsRegistry';
import type { MainStats, SecondaryStats, Skills, StatBlock } from '@/types/character.types';
import type { CombatStatus } from '@/types/combat.types';
import type { ActiveTrait, TraitId, TriggerRule } from '@/types/traits.types';

import type { GameSlice } from '../types';

/**
 * Универсальная функция для суммирования характеристик из списка трейтов.
 * Читаемая версия: берет группу статов и складывает числа.
 */
const aggregateStats = <T extends Record<string, number>>(
  activeTraits: ActiveTrait[],
  categoryKey: keyof StatBlock,
): T => {
  // Инициализируем пустой объект-аккумулятор
  const totalStats = {} as T;

  for (const trait of activeTraits) {
    const lvl = traitsRegistry.resolveLevel(trait.id, trait.level);

    // Пропускаем, если нет модов вообще или нет нужной категории (например, skills)
    if (!lvl?.mods || !lvl.mods[categoryKey]) continue;

    const statsGroup = lvl.mods[categoryKey];

    // Проходим по каждому стату в группе (например: strength: 1, agility: 2)
    for (const [key, value] of Object.entries(statsGroup)) {
      const statName = key as keyof T;
      const modifierValue = value as number;

      // Берем текущее значение или 0, если его еще нет
      const currentValue = (totalStats[statName] as number) ?? 0;

      // Записываем сумму
      totalStats[statName] = (currentValue + modifierValue) as T[keyof T];
    }
  }

  return totalStats;
};

export interface TraitsSlice {
  traitsByCharacterId: Record<string, ActiveTrait[]>;

  actions: {
    addTraitToCharacter: (
      characterId: string,
      traitId: TraitId,
      params?: { level?: number },
    ) => boolean;
    removeTraitFromCharacter: (characterId: string, traitId: TraitId) => void;
    resetCharacterTraits: (characterId: string) => void;
    modifyTrait: (characterId: string, traitId: TraitId, props: Partial<ActiveTrait>) => void;
    processDayEnd: () => Record<string, TriggerRule[]>;
    processBattleEnd: (combatStatus: CombatStatus) => Record<string, TriggerRule[]>;
  };
}

export const traitsSelectors = {
  selectTraitsByCharacterId:
    (characterId: string) =>
    (state: StoreState): ActiveTrait[] =>
      state.traits.traitsByCharacterId[characterId] ?? [],

  // Селектор для Основных характеристик (STR, DEX...)
  selectMainStatMods:
    (characterId: string) =>
    (state: StoreState): Partial<MainStats> => {
      const active = state.traits.traitsByCharacterId[characterId] ?? [];
      return aggregateStats<MainStats>(active, 'mainStats');
    },

  // Селектор для Навыков (Melee, Crafting...)
  selectSkillMods:
    (characterId: string) =>
    (state: StoreState): Partial<Skills> => {
      const active = state.traits.traitsByCharacterId[characterId] ?? [];
      return aggregateStats<Skills>(active, 'skills');
    },

  // Селектор для Вторичных статов (HP, Armor...)
  selectSecondaryStatMods:
    (characterId: string) =>
    (state: StoreState): Partial<SecondaryStats> => {
      const active = state.traits.traitsByCharacterId[characterId] ?? [];
      return aggregateStats<SecondaryStats>(active, 'secondaryStats');
    },
};

export const createTraitsSlice: GameSlice<TraitsSlice> = (set, get) => ({
  traitsByCharacterId: {},

  actions: {
    addTraitToCharacter: (characterId, traitId, params) => {
      set((state) => {
        const currentTraits = state.traits.traitsByCharacterId[characterId] ?? [];

        if (!traitsManager.canAddTrait(traitId, currentTraits)) return;

        const level = params?.level ?? 0;
        const newTrait = traitsRegistry.createActiveTrait(traitId, level);

        if (newTrait) {
          currentTraits.push(newTrait);
          state.traits.traitsByCharacterId[characterId] = currentTraits;
        }
      });
      return true;
    },

    removeTraitFromCharacter: (characterId, traitId) => {
      set((state) => {
        const list = state.traits.traitsByCharacterId[characterId] ?? [];
        state.traits.traitsByCharacterId[characterId] = list.filter((t) => t.id !== traitId);
      });
    },

    resetCharacterTraits: (characterId) => {
      set((state) => {
        state.traits.traitsByCharacterId[characterId] = [];
      });
    },

    modifyTrait: (characterId, traitId, props) => {
      set((state) => {
        const list = state.traits.traitsByCharacterId[characterId] ?? [];
        const trait = list.find((t) => t.id === traitId);
        if (!trait) return;

        if (props.level !== undefined && props.level !== trait.level) {
          const lvl = traitsRegistry.resolveLevel(trait.id, props.level);
          if (lvl) {
            trait.level = props.level;
            trait.duration = props.duration ?? lvl.duration;
            trait.progress = props.progress ?? lvl.progress;
            trait.progressMax = props.progressMax ?? lvl.progressMax ?? null;
          }
        }

        Object.assign(trait, props);
      });
    },

    processDayEnd: (): Record<string, TriggerRule[]> => {
      const { traitsByCharacterId } = get().traits;
      const charIds = Object.keys(traitsByCharacterId);
      const allEffects: Record<string, TriggerRule[]> = {};

      set((state) => {
        for (const id of charIds) {
          const currentTraits = state.traits.traitsByCharacterId[id] ?? [];
          const { updatedTraits, effects } =
            traitsManager.computeOnDayPassForCharacter(currentTraits);
          state.traits.traitsByCharacterId[id] = updatedTraits;
          allEffects[id] = effects;
        }
      });

      return allEffects;
    },

    processBattleEnd: (combatStatus) => {
      const activeIds = get().party.activeIds;
      const allEffects: Record<string, TriggerRule[]> = {};

      set((state) => {
        for (const id of activeIds) {
          const currentTraits = state.traits.traitsByCharacterId[id] ?? [];
          const { effects } = traitsManager.computeOnBattleEndForCharacter(
            currentTraits,
            combatStatus,
          );
          allEffects[id] = effects;
        }
      });

      return allEffects;
    },
  },
});
