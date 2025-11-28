import type { ArmorTemplate } from '@/types/armor.types';

// increase positive mods and decrease negative mods
export const ARMOR_RARITY_MULTIPLIERS_DEFAULT = { uncommon: 1.15, rare: 1.3, unique: 1.5 };

export const ARMOR_TEMPLATES_DB: Record<string, ArmorTemplate> = {
  regularCloth: {
    templateId: 'regularCloth',
    type: 'armor',
    price: 30,
    dropRate: 0.0,
    mods: {
      secondaryStats: {
        armor: 3,
        evasion: 1,
      },
    },
  },
  travelDuster: {
    templateId: 'travelDuster',
    type: 'armor',
    price: 60,
    dropRate: 0.95,
    // dropRate: 0.3,
    mods: {
      secondaryStats: {
        armor: 3,
        evasion: 1,
      },
    },
  },
  lightLeatherArmor: {
    templateId: 'lightLeatherArmor',
    type: 'armor',
    price: 150,
    dropRate: 0.95,
    // dropRate: 0.15,
    mods: {
      secondaryStats: {
        armor: 8,
        evasion: -2,
      },
    },
  },
  reinforcedLeatherArmor: {
    templateId: 'reinforcedLeatherArmor',
    type: 'armor',
    price: 250,
    dropRate: 0.95,
    // dropRate: 0.1,
    requirements: {
      mainStats: { str: 30 },
    },
    mods: {
      secondaryStats: {
        armor: 13,
        evasion: -3,
        initiative: -1,
      },
    },
  },
};
