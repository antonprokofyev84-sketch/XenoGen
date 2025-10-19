import type { Rarity } from '@/types/common.types.js';

export interface ArmorTemplate {
  templateId: string;
  slot: 'armor' | 'outerwear' | 'accessory';
  price: number;
  dropRate: number;
  requiredStrength?: number;
  mods: Record<string, number>;
  rarityMultipliers?: {
    uncommon?: number;
    rare?: number;
    unique?: number;
  };
}

export interface ArmorInstance extends Omit<ArmorTemplate, 'dropRate' | 'rarityMultipliers'> {
  instanceId: string; // A unique ID for this specific item instance
  rarity: Rarity;
}
