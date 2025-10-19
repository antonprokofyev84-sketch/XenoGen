import { PROTAGONIST_TEMPLATE } from '@/data/character.templates';
import type { StoreState } from '@/state/useGameState';
import type {
  BaseStats,
  Character,
  MainStatKey,
  MainStats,
  SecondaryStats,
  SkillKey,
  Skills,
} from '@/types/character.types';

import { skillKeys } from '../constants';
import type { GameSlice } from '../types';
import { equipmentSelectors } from './equipment';
import { traitsSelectors } from './traits';

/**
 * The core slice for managing all characters in the game, including the protagonist and NPCs.
 */
export interface CharactersSlice {
  byId: Record<string, Character>; // All characters are stored here, indexed by ID
  protagonistId: string; // The ID of the main character
  actions: {
    setName: (characterId: string, name: string) => void;
    changeMainStat: (characterId: string, stat: MainStatKey, delta: number) => void;
    setMainStat: (characterId: string, stat: MainStatKey, value: number) => void;
    changeSkill: (characterId: string, skill: SkillKey, delta: number) => void;
    setSkill: (characterId: string, skill: SkillKey, value: number) => void;
    finalizeCharacterCreation: (characterId: string) => void;
    resetHpToMax: (characterId: string) => void;
    changeStamina: (characterId: string, delta: number) => void;
    resetStaminaToMax: (characterId: string) => void;
    resetProtagonist: () => void;
  };
}

// --- Helper Functions ---

const applyMods = <T extends Record<string, number>>(
  base: T,
  ...mods: Record<string, number>[]
): T => {
  const result = { ...base };
  for (const modSet of mods) {
    for (const key in modSet) {
      if (key in result) {
        result[key as keyof T] = ((result[key as keyof T] || 0) + modSet[key]) as T[keyof T];
      }
    }
  }
  return result;
};

// --- Pure Calculation Functions ---

const calculateMaxHp = (mainStats: MainStats, baseStats: BaseStats): number => {
  return baseStats.baseHp + Math.floor(mainStats.con / 1.5) + Math.floor(mainStats.str / 5);
};
const calculateMaxStamina = (mainStats: MainStats, baseStats: BaseStats): number => {
  return baseStats.baseStamina + mainStats.con + Math.floor(mainStats.will / 2);
};
const calculateInitiative = (mainStats: MainStats, baseStats: BaseStats): number => {
  return baseStats.baseInitiative + Math.floor(mainStats.dex / 10) + Math.floor(mainStats.int / 25);
};
const calculateArmor = (mainStats: MainStats, baseStats: BaseStats): number => {
  return baseStats.baseArmor + Math.floor(mainStats.con / 30);
};
const calculateCritChance = (mainStats: MainStats, baseStats: BaseStats): number => {
  return baseStats.baseCritChance + Math.floor(mainStats.per / 20) + Math.floor(mainStats.int / 50);
};
const calculateDamageModifier = (mainStats: MainStats, baseStats: BaseStats): number => {
  return baseStats.baseDamage + Math.floor(mainStats.str / 10);
};
const calculateEvasion = (mainStats: MainStats): number => {
  return Math.floor(mainStats.dex / 2) + Math.floor(mainStats.per / 10);
};

// --- Selectors ---

export const characterSelectors = {
  /** Selects a character object by their ID. */
  selectCharacterById:
    (characterId: string) =>
    (state: StoreState): Character | undefined =>
      state.characters.byId[characterId],

  /** A convenient selector to get the protagonist's full data. */
  selectProtagonist: (state: StoreState): Character => {
    return state.characters.byId[state.characters.protagonistId] as Character;
  },

  selectMainStats:
    (characterId: string) =>
    (state: StoreState): MainStats => {
      const character = state.characters.byId[characterId];
      return character ? character.mainStats : ({} as MainStats);
    },

  selectSkills:
    (characterId: string) =>
    (state: StoreState): Skills => {
      const character = state.characters.byId[characterId];
      return character ? character.skills : ({} as Skills);
    },

  /** Calculates all secondary stats for a character. */
  selectSecondaryStats:
    (characterId: string) =>
    (state: StoreState): SecondaryStats => {
      const character = state.characters.byId[characterId];
      if (!character)
        return {
          maxHp: 0,
          maxStamina: 0,
          armor: 0,
          evasion: 0,
          damageModifier: 0,
          critChance: 0,
          initiative: 0,
        };
      const { mainStats, baseStats } = character;
      return {
        maxHp: calculateMaxHp(mainStats, baseStats),
        maxStamina: calculateMaxStamina(mainStats, baseStats),
        armor: calculateArmor(mainStats, baseStats),
        evasion: calculateEvasion(mainStats),
        damageModifier: calculateDamageModifier(mainStats, baseStats),
        critChance: calculateCritChance(mainStats, baseStats),
        initiative: calculateInitiative(mainStats, baseStats),
      };
    },

  /** Calculates the base skills derived from a character's main stats. */
  /** This is mostly used for protagonist creation */
  selectBaseSkills:
    (characterId: string) =>
    (state: StoreState): Skills => {
      const character = state.characters.byId[characterId];
      if (!character) return {} as Skills;
      const { mainStats } = character;
      return {
        melee: Math.floor(mainStats.str / 5 + mainStats.dex / 10),
        range: Math.floor(mainStats.per / 5 + mainStats.dex / 10),
        crafting: Math.floor(
          mainStats.int / 10 + mainStats.str / 10 + mainStats.dex / 10 + mainStats.per / 15,
        ),
        science: Math.floor(mainStats.int / 5 + mainStats.per / 10),
        medicine: Math.floor(mainStats.int / 5 + mainStats.dex / 15 + mainStats.per / 15),
        charisma: Math.floor(mainStats.will / 5 + mainStats.int / 10),
        survival: Math.floor(mainStats.per / 5 + mainStats.con / 15 + mainStats.will / 15),
      };
    },

  /** Calculates the final, effective main stats after applying trait modifiers. */
  selectEffectiveMainStats:
    (characterId: string) =>
    (state: StoreState): MainStats => {
      const character = state.characters.byId[characterId];
      if (!character) return {} as MainStats;

      const traitMods = traitsSelectors.selectMainStatMods(characterId)(state);
      const equipmentMods = equipmentSelectors.selectMainStatMods(characterId)(state);

      return applyMods(character.mainStats, traitMods, equipmentMods);
    },

  /** Calculates the final, effective skills after applying trait modifiers. */
  selectEffectiveSkills:
    (characterId: string) =>
    (state: StoreState): Skills => {
      const character = state.characters.byId[characterId];
      if (!character) return {} as Skills;

      const traitMods = traitsSelectors.selectSkillMods(characterId)(state);
      const equipmentMods = equipmentSelectors.selectSkillMods(characterId)(state);

      return applyMods(character.skills, traitMods, equipmentMods);
    },

  selectEffectiveSecondaryStats:
    (characterId: string) =>
    (state: StoreState): SecondaryStats => {
      const character = state.characters.byId[characterId];
      if (!character) return {} as SecondaryStats;

      const baseSecondary = characterSelectors.selectSecondaryStats(characterId)(state);
      const traitMods = traitsSelectors.selectSecondaryStatMods(characterId)(state);
      const equipmentMods = equipmentSelectors.selectSecondaryStatMods(characterId)(state);

      return applyMods(baseSecondary, traitMods, equipmentMods);
    },
};

// --- Slice Creator Function ---

export const createCharactersSlice: GameSlice<CharactersSlice> = (set, get) => ({
  protagonistId: 'protagonist',
  byId: {},

  actions: {
    setName: (characterId, name) =>
      set((state) => {
        const char = state.characters.byId[characterId];
        if (char) char.name = name;
      }),

    changeMainStat: (characterId, stat, delta) =>
      set((state) => {
        const char = state.characters.byId[characterId];
        if (char) char.mainStats[stat] = Math.max(0, char.mainStats[stat] + delta);
      }),

    setMainStat: (characterId, stat, value) =>
      set((state) => {
        const char = state.characters.byId[characterId];
        if (char) char.mainStats[stat] = value;
      }),

    changeSkill: (characterId, skill, delta) =>
      set((state) => {
        const char = state.characters.byId[characterId];
        if (char) char.skills[skill] = Math.max(0, char.skills[skill] + delta);
      }),

    setSkill: (characterId, skill, value) =>
      set((state) => {
        const char = state.characters.byId[characterId];
        if (char) char.skills[skill] = value;
      }),

    finalizeCharacterCreation: (characterId: string) =>
      //for now just finalize skills
      {
        set((state) => {
          const char = state.characters.byId[characterId];
          const baseSkills = characterSelectors.selectBaseSkills(characterId)(state);
          const finalSkills: Skills = { ...char.skills };

          skillKeys.forEach((skill) => {
            finalSkills[skill] = (char.skills[skill] || 0) + (baseSkills[skill] || 0);
          });

          char.skills = finalSkills;
        });

        get().characters.actions.resetHpToMax(characterId);
        get().characters.actions.resetStaminaToMax(characterId);
        get().equipment.actions.resetCharacterEquipment(characterId);
      },

    resetProtagonist: () =>
      set((state) => {
        const protagonistId = state.characters.protagonistId;
        const template = PROTAGONIST_TEMPLATE;
        if (template) {
          state.characters.byId[protagonistId] = { ...template };
        }
      }),

    resetHpToMax: (characterId) =>
      set((state) => {
        const char = state.characters.byId[characterId];
        if (char) {
          const { mainStats, baseStats } = char;
          char.hp = calculateMaxHp(mainStats, baseStats);
        }
      }),

    resetStaminaToMax: (characterId) =>
      set((state) => {
        const char = state.characters.byId[characterId];
        if (char) {
          const { mainStats, baseStats } = char;
          char.stamina = calculateMaxStamina(mainStats, baseStats);
        }
      }),

    changeStamina: (characterId: string, delta: number) => {
      set((state) => {
        const char = state.characters.byId[characterId];

        const maxStamina = calculateMaxStamina(char.mainStats, char.baseStats);
        const newStamina = char.stamina + delta;
        char.stamina = Math.max(-maxStamina, Math.min(newStamina, maxStamina));
      });
      console.log(get().characters.byId[characterId]);
    },
  },
});
