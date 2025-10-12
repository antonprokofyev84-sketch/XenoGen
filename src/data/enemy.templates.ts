import type { EnemyTemplate } from '@/types/enemy.types';

export const TIER_UP_DELTAS = {
  hp: 6.9,
  armor: 0.26,
  baseMeleeDamage: 0.8,
  melee: 8,
  ranged: 8,
  evasion: 4.8,
  initiative: 1.12,
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

export const ENEMY_TEMPLATES_DB: Record<string, EnemyTemplate> = {
  youngScavenger: {
    id: '',
    characterTemplateId: 'youngScavenger',
    faction: 'scavengers',
    baseLevel: 1,
    tierScalingFactor: 0.8,
    baseStats: {
      hp: 45,
      armor: 2,
      baseMeleeDamage: 3,
      melee: 30,
      ranged: 5,
      evasion: 8,
      initiative: 10,
      critChance: 5,
    },
    weaponId: 'makeshiftKnife',
    bodyArmorId: 'regularCloth',
  },
};
