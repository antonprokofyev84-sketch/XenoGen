import type { MainStatKey, SkillKey, SecondaryStatKey } from '@/types/character.types';

export const mainStatKeys: MainStatKey[] = ['str', 'dex', 'con', 'per', 'int', 'will'] as const;

export const secondaryStatsKeys: SecondaryStatKey[] = [
  'maxHp',
  'armor',
  'evasion',
  'damageModifier',
  'critChance',
  'initiative',
] as const;

export const skillKeys: SkillKey[] = [
  'melee',
  'range',
  'crafting',
  'science',
  'medicine',
  'charisma',
  'survival',
] as const;

export const initiatMainStatValue = 30;
