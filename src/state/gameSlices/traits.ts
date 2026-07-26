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

  // Селектор для основных характеристик (STR, DEX...)
  selectMainStatMods:
    (characterId: string) =>
    (state: StoreState): Partial<MainStats> => {
      const active = state.traits.traitsByCharacterId[characterId] ?? [];
      return aggregateStats<MainStats>(active, 'mainStats');
    },

  // Селектор для навыков (Melee, Crafting...)
  selectSkillMods:
    (characterId: string) =>
    (state: StoreState): Partial<Skills> => {
      const active = state.traits.traitsByCharacterId[characterId] ?? [];
      return aggregateStats<Skills>(active, 'skills');
    },

  // Селектор для вторичных статов (HP, Armor...)
  selectSecondaryStatMods:
    (characterId: string) =>
    (state: StoreState): Partial<SecondaryStats> => {
      const active = state.traits.traitsByCharacterId[characterId] ?? [];
      return aggregateStats<SecondaryStats>(active, 'secondaryStats');
    },
};

// --- Draft helpers (operate directly on an Immer draft, no nested set()) ---

const addTraitToCharacterDraft = (
  state: StoreState,
  characterId: string,
  traitId: TraitId,
  params?: { level?: number },
): boolean => {
  const currentTraits = state.traits.traitsByCharacterId[characterId] ?? [];

  if (!traitsManager.canAddTrait(traitId, currentTraits)) return false;

  const level = params?.level ?? 0;
  const newTrait = traitsRegistry.createActiveTrait(traitId, level);

  if (newTrait) {
    currentTraits.push(newTrait);
    state.traits.traitsByCharacterId[characterId] = currentTraits;
  }
  return true;
};

const removeTraitFromCharacterDraft = (
  state: StoreState,
  characterId: string,
  traitId: TraitId,
) => {
  const list = state.traits.traitsByCharacterId[characterId] ?? [];
  state.traits.traitsByCharacterId[characterId] = list.filter((t) => t.id !== traitId);
};

const modifyTraitDraft = (
  state: StoreState,
  characterId: string,
  traitId: TraitId,
  props: Partial<ActiveTrait>,
) => {
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
};

const collectDayPassEffectsDraft = (state: StoreState): Record<string, TriggerRule[]> => {
  const charIds = Object.keys(state.traits.traitsByCharacterId);
  const allEffects: Record<string, TriggerRule[]> = {};

  for (const id of charIds) {
    const currentTraits = state.traits.traitsByCharacterId[id] ?? [];
    const { updatedTraits, effects } = traitsManager.computeOnDayPassForCharacter(currentTraits);
    state.traits.traitsByCharacterId[id] = updatedTraits;
    allEffects[id] = effects;
  }

  return allEffects;
};

const collectBattleEndEffectsDraft = (
  state: StoreState,
  combatStatus: CombatStatus,
): Record<string, TriggerRule[]> => {
  const activeIds = state.party.activeIds;
  const allEffects: Record<string, TriggerRule[]> = {};

  for (const id of activeIds) {
    const currentTraits = state.traits.traitsByCharacterId[id] ?? [];
    const { effects } = traitsManager.computeOnBattleEndForCharacter(currentTraits, combatStatus);
    allEffects[id] = effects;
  }

  return allEffects;
};

// Expose draft helpers for external systems that operate inside a single `draft` call
export const traitsDraft = {
  addTraitToCharacter: addTraitToCharacterDraft,
  removeTraitFromCharacter: removeTraitFromCharacterDraft,
  modifyTrait: modifyTraitDraft,
  collectDayPassEffects: collectDayPassEffectsDraft,
  collectBattleEndEffects: collectBattleEndEffectsDraft,
};

export const createTraitsSlice: GameSlice<TraitsSlice> = (set) => ({
  traitsByCharacterId: {},

  actions: {
    addTraitToCharacter: (characterId, traitId, params) => {
      set((state) => {
        addTraitToCharacterDraft(state, characterId, traitId, params);
      });
      return true;
    },

    removeTraitFromCharacter: (characterId, traitId) => {
      set((state) => {
        removeTraitFromCharacterDraft(state, characterId, traitId);
      });
    },

    resetCharacterTraits: (characterId) => {
      set((state) => {
        state.traits.traitsByCharacterId[characterId] = [];
      });
    },

    modifyTrait: (characterId, traitId, props) => {
      set((state) => {
        modifyTraitDraft(state, characterId, traitId, props);
      });
    },

    processDayEnd: (): Record<string, TriggerRule[]> => {
      let allEffects: Record<string, TriggerRule[]> = {};
      set((state) => {
        allEffects = collectDayPassEffectsDraft(state);
      });
      return allEffects;
    },

    processBattleEnd: (combatStatus) => {
      let allEffects: Record<string, TriggerRule[]> = {};
      set((state) => {
        allEffects = collectBattleEndEffectsDraft(state, combatStatus);
      });
      return allEffects;
    },
  },
});
