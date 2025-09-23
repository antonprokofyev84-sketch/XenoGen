import type { GameSlice } from '../types';
import type { StoreState } from '@/state/useGameState';
import type { MainStatKey, MainStats, SkillKey, Skills, BaseStats } from '@/types/character.types';
import { traitsSelectors } from './traits';
import { initiatMainStatValue } from '@/state/constants';

export interface PlayerSlice {
  name: string;
  id: string;
  hp: number;
  baseStats: BaseStats;
  mainStats: MainStats;
  skills: Skills;
  actions: {
    setName: (name: string) => void;
    changeMainStat: (stat: MainStatKey, delta: number) => void;
    setMainStat: (stat: MainStatKey, value: number) => void;
    resetMainStats: () => void;
    changeSkill: (skill: SkillKey, delta: number) => void;
    setSkill: (skill: SkillKey, value: number) => void;
    resetSkills: () => void;
    resetHpToMax: () => void;
  };
}

const applyMods = <T extends Record<string, number>>(base: T, mods: Record<string, number>): T => {
  const result = { ...base };
  for (const key in mods) {
    if (key in result) {
      result[key as keyof T] = ((result[key as keyof T] || 0) + mods[key]) as T[keyof T];
    }
  }
  return result;
};

const calculateMaxHp = (mainStats: MainStats, baseStats: BaseStats): number => {
  return baseStats.baseHp + mainStats.con + Math.floor(mainStats.str / 5);
};
const calculateInitiative = (mainStats: MainStats, baseStats: BaseStats): number => {
  return baseStats.baseInitiative + Math.floor(mainStats.dex / 10) + Math.floor(mainStats.int / 25);
};
const calculateArmor = (mainStats: MainStats, baseStats: BaseStats): number => {
  return baseStats.baseArmor + Math.floor(mainStats.con / 20);
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

const initialMainStats: MainStats = {
  str: initiatMainStatValue,
  dex: initiatMainStatValue,
  con: initiatMainStatValue,
  per: initiatMainStatValue,
  int: initiatMainStatValue,
  will: initiatMainStatValue,
};

const initialSkills: Skills = {
  melee: 0,
  range: 0,
  crafting: 0,
  science: 0,
  medicine: 0,
  charisma: 0,
  survival: 0,
};

export const playerSelectors = {
  name: (state: StoreState) => state.player.name,
  id: (state: StoreState) => state.player.id,
  hp: (state: StoreState) => state.player.hp,
  mainStats: (state: StoreState) => state.player.mainStats,
  baseStats: (state: StoreState) => state.player.baseStats,
  skills: (state: StoreState) => state.player.skills,
  baseSkills: (state: StoreState): Skills => {
    const { mainStats } = state.player;
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
  secondaryStats: (state: StoreState) => {
    const { mainStats, baseStats } = state.player;

    return {
      maxHp: calculateMaxHp(mainStats, baseStats),
      armor: calculateArmor(mainStats, baseStats),
      evasion: calculateEvasion(mainStats),
      damageModifier: calculateDamageModifier(mainStats, baseStats),
      critChance: calculateCritChance(mainStats, baseStats),
      initiative: calculateInitiative(mainStats, baseStats),
    };
  },

  effectiveMainStats: (state: StoreState): MainStats => {
    const base = playerSelectors.mainStats(state);
    const mods = traitsSelectors.selectMainStatMods(state.player.id)(state);
    return applyMods(base, mods);
  },

  effectiveSkills: (state: StoreState): Skills => {
    const base = playerSelectors.skills(state);
    const mods = traitsSelectors.selectSkillMods(state.player.id)(state);
    return applyMods(base, mods);
  },

  effectiveSecondaryStats: (state: StoreState) => {
    const base = playerSelectors.secondaryStats(state);
    const mods = traitsSelectors.selectSecondaryStatMods(state.player.id)(state);
    return applyMods(base, mods);
  },
};

export const createPlayerSlice: GameSlice<PlayerSlice> = (set, get) => ({
  name: 'Hero',
  id: 'Hero',
  hp: 1,
  baseStats: {
    age: 30,
    gameAge: 0,
    beauty: 5,
    fame: 0,
    baseHp: 30,
    baseInitiative: 5,
    baseArmor: 0,
    baseCritChance: 5,
    baseDamage: 1,
    baseAccuracy: 30,
  },
  mainStats: { ...initialMainStats },
  skills: { ...initialSkills },

  actions: {
    setName: (name) =>
      set((state) => {
        state.player.name = name;
      }),

    changeMainStat: (stat, delta) =>
      set((state) => {
        const currentVal = state.player.mainStats[stat];
        state.player.mainStats[stat] = Math.max(0, currentVal + delta);
      }),

    setMainStat: (stat, value) =>
      set((state) => {
        state.player.mainStats[stat] = value;
      }),

    resetMainStats: () =>
      set((state) => {
        state.player.mainStats = { ...initialMainStats };
      }),

    changeSkill: (skill, delta) =>
      set((state) => {
        const currentVal = state.player.skills[skill];
        state.player.skills[skill] = Math.max(0, currentVal + delta);
      }),

    setSkill: (skill, value) =>
      set((state) => {
        state.player.skills[skill] = value;
      }),

    resetSkills: () =>
      set((state) => {
        state.player.skills = { ...initialSkills };
      }),

    resetHpToMax: () =>
      set((state) => {
        state.player.hp = calculateMaxHp(get().player.mainStats, get().player.baseStats);
      }),
  },
});
