import type { StatBlock } from './character.types';
import type { Rarity } from './common.types';

export type WeaponType = 'meleeWeapon' | 'rangeWeapon';

export interface WeaponTemplate {
  templateId: string;
  type: WeaponType;
  price: number;
  dropRate: number;
  distance: number;
  attacksPerTurn: number;
  damage: [min: number, max: number];
  armorPiercing: number;
  lethality: number;
  rarityMultipliers?: {
    uncommon?: number;
    rare?: number;
    unique?: number;
  };
  mods?: StatBlock;
  requirements?: StatBlock;
}

export type WeaponInstance = Omit<WeaponTemplate, 'dropRate' | 'rarityMultipliers'> & {
  rarity: Rarity;
};
