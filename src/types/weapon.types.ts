import type { Rarity } from '@/types/common.types.js';

export interface WeaponTemplate {
  id: string;
  slot: 'melee' | 'range';
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
  rarityMultipliers?: {
    uncommon?: number;
    rare?: number;
    unique?: number;
  };
}

export type WeaponInstance = Omit<WeaponTemplate, 'dropRate' | 'rarityMultipliers'> & {
  instanceId: string;
  rarity: Rarity;
};
