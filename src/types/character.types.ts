export type MainStatKey = 'str' | 'dex' | 'con' | 'per' | 'int' | 'will';
export type MainStats = Record<MainStatKey, number>;
export type SkillKey =
  | 'melee'
  | 'range'
  | 'crafting'
  | 'science'
  | 'medicine'
  | 'charisma'
  | 'survival';

export type Skills = Record<SkillKey, number>;

export type SecondaryStatKey =
  | 'maxHp'
  | 'armor'
  | 'evasion'
  | 'damageModifier'
  | 'critChance'
  | 'initiative';
export type SecondaryStats = Record<SecondaryStatKey, number>;

export interface BaseStats {
  age: number;
  gameAge: number;
  beauty: number;
  fame: number;
  baseHp: number;
  baseInitiative: number;
  baseArmor: number;
  baseCritChance: number;
  baseDamage: number;
  baseAccuracy: number;
}
