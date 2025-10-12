import type { Rarity } from '@/types/common.types.js';

const multiply = (a: number) => (b: number) => a * b;
const add = (a: number) => (b: number) => a + b;

type StatKey =
  | 'hp'
  | 'armor'
  | 'baseMeleeDamage'
  | 'melee'
  | 'ranged'
  | 'evasion'
  | 'initiative'
  | 'critChance';

type StatAppliers = Partial<Record<StatKey, (x: number) => number>>;

// «цементируем» правила редкости:
export const RARITY_RULES: Partial<Record<Rarity, StatAppliers>> = {
  uncommon: {
    hp: multiply(1.1),
    melee: multiply(1.1),
    ranged: multiply(1.1),
    armor: multiply(1.1),
    baseMeleeDamage: add(1),
    evasion: add(3),
    critChance: add(1),
  },
  rare: {
    hp: multiply(1.2),
    melee: multiply(1.2),
    ranged: multiply(1.2),
    armor: multiply(1.2),
    baseMeleeDamage: add(2),
    evasion: add(6),
    critChance: add(2),
  },
  unique: {
    hp: multiply(1.3),
    melee: multiply(1.3),
    ranged: multiply(1.3),
    armor: multiply(1.3),
    baseMeleeDamage: add(3),
    evasion: add(9),
    critChance: add(3),
  },
} as const;
