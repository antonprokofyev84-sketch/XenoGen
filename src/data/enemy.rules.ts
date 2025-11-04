import type { Rarity } from '@/types/common.types';

const multiply = (a: number) => (b: number) => a * b;
const add = (a: number) => (b: number) => a + b;

type StatKey =
  | 'hp'
  | 'armor'
  | 'baseMeleeDamage'
  | 'melee'
  | 'range'
  | 'evasion'
  | 'initiative'
  | 'critChance';

type StatAppliers = Partial<Record<StatKey, (x: number) => number>>;

// «цементируем» правила редкости:
export const RARITY_RULES: Partial<Record<Rarity, StatAppliers>> = {
  uncommon: {
    hp: multiply(1.1),
    melee: multiply(1.1),
    range: multiply(1.1),
    armor: multiply(1.1),
    baseMeleeDamage: add(1),
    evasion: add(3),
    critChance: add(1),
  },
  rare: {
    hp: multiply(1.2),
    melee: multiply(1.2),
    range: multiply(1.2),
    armor: multiply(1.2),
    baseMeleeDamage: add(2),
    evasion: add(6),
    critChance: add(2),
  },
  unique: {
    hp: multiply(1.3),
    melee: multiply(1.3),
    range: multiply(1.3),
    armor: multiply(1.3),
    baseMeleeDamage: add(3),
    evasion: add(9),
    critChance: add(3),
  },
} as const;

export const MIN_ENEMY_TIER = 0;
export const MAX_ENEMY_TIER = 2;

export const TIER_UP_DELTAS = {
  hp: 6.9,
  armor: 0.26,
  baseMeleeDamage: 0.8,
  melee: 8,
  range: 8,
  evasion: 4.8,
  initiative: 0.56,
  critChance: 0.56,
};

export const ENEMY_RARITY_CHANCE = { common: 0.7, uncommon: 0.2, rare: 0.08, unique: 0.02 };

export const EQUIPMENT_BY_TIER_CHANCE = {
  0: {
    common: 0.8,
    uncommon: 0.12,
    rare: 0.06,
    unique: 0.02,
  },
  1: {
    common: 0.5,
    uncommon: 0.24,
    rare: 0.12,
    unique: 0.04,
  },
  2: {
    common: 0.4,
    uncommon: 0.36,
    rare: 0.18,
    unique: 0.06,
  },
};
