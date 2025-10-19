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
  | 'maxStamina'
  | 'armor'
  | 'evasion'
  | 'damageModifier'
  | 'critChance'
  | 'initiative';

export type SecondaryStats = Record<SecondaryStatKey, number>;

export type BaseStatsKey =
  | 'age'
  | 'gameAge'
  | 'beauty'
  | 'fame'
  | 'baseHp'
  | 'baseStamina'
  | 'baseInitiative'
  | 'baseArmor'
  | 'baseCritChance'
  | 'baseDamage'
  | 'baseAccuracy';
export type BaseStats = Record<BaseStatsKey, number>;

export interface Character {
  id: string;
  templateId: string;
  name: string;
  hp: number;
  stamina: number;
  baseStats: BaseStats;
  mainStats: MainStats;
  skills: Skills;
}

// templates types

export type Rarity = 'common' | 'rare' | 'unique';

export type TemplateStat = number | [base: number, random: number];

export interface ArchetypeTemplate {
  id: string;
  baseStats?: Partial<Record<BaseStatsKey, TemplateStat>>;
  mainStats?: Partial<Record<MainStatKey, TemplateStat>>;
  skills?: Partial<Record<SkillKey, TemplateStat>>;
  traitsRequired?: string[];
  traitsPossible?: string[];
}

export interface CharacterTemplate {
  id: string;
  name: string;
  baseStats: Record<BaseStatsKey, TemplateStat>;
  mainStats: Record<MainStatKey, TemplateStat>;
  skills: Record<SkillKey, TemplateStat>;
  traitsRequired?: string[];
  traitsPossible?: string[];
  archetypesPossible?: string[];
}
