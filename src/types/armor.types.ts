import type { StatBlock } from './character.types';
import type { Rarity } from './common.types';

export interface ArmorTemplate {
  templateId: string;
  type: 'armor';
  price: number;
  dropRate: number;
  rarityMultipliers?: {
    uncommon?: number;
    rare?: number;
    unique?: number;
  };
  mods: StatBlock;
  requirements?: StatBlock;
}

export interface ArmorInstance extends Omit<ArmorTemplate, 'dropRate' | 'rarityMultipliers'> {
  rarity: Rarity;
}
