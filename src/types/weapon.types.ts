import type { Rarity } from '@/types/common.types';

export type WeaponType = 'meleeWeapon' | 'rangeWeapon';

export interface WeaponTemplate {
  templateId: string;
  type: WeaponType;
  price: number;
  dropRate: number;
  requiredStrength?: number;
  requiredMelee?: number;
  requiredRanged?: number;
  distance: number;
  attacksPerTurn: number;
  damage: [min: number, max: number];
  armorPiercing: number;
  mods?: Record<string, number>;
  lethality: number;
  rarityMultipliers?: {
    uncommon?: number;
    rare?: number;
    unique?: number;
  };
}

export type WeaponInstance = Omit<WeaponTemplate, 'dropRate' | 'rarityMultipliers'> & {
  id: string;
  rarity: Rarity;
};
