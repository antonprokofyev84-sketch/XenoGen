import type { MainStatKey, SecondaryStatKey, SkillKey } from '@/types/character.types';

export const mainStatKeys: MainStatKey[] = [
  'str',
  'dex',
  'con',
  'per',
  'int',
  'will',
  'bty',
] as const;

export const secondaryStatsKeys: SecondaryStatKey[] = [
  'maxHp',
  'armor',
  'evasion',
  'meleeAttackPower',
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
  'trade',
] as const;

export const initialMainStatValue = 30;
