import type { WeaponTemplate } from '@/types/weapon.types';

// increase damage and ap
export const WEAPON_RARITY_MULTIPLIERS_DEFAULT = { uncommon: 1.1, rare: 1.2, unique: 1.3 };

//probably i need to combine all static fields into statBlock (distance, attacksPerTurn, dropRate, lethality)

export const WEAPON_TEMPLATES_DB: Record<string, WeaponTemplate> = {
  // --- MELEE WEAPONS ---
  fists: {
    templateId: 'fists',
    type: 'meleeWeapon',
    price: 0,
    dropRate: 0.0,
    // requirements: undefined
    distance: 1,
    attacksPerTurn: 3,
    damage: [16, 18],
    armorPiercing: 4,
    lethality: 0.1,
  },
  makeshiftKnife: {
    templateId: 'makeshiftKnife',
    type: 'meleeWeapon',
    price: 40,
    dropRate: 0.95,
    requirements: {
      skills: { melee: 15 },
    },
    // testing purpose
    // mods: {
    //   skills: { melee: 40 },
    // },
    distance: 1,
    attacksPerTurn: 2,
    damage: [8, 12],
    armorPiercing: 3,
    lethality: 0.45,
  },

  spear: {
    templateId: 'spear',
    type: 'meleeWeapon',
    price: 110,
    dropRate: 0.95,
    requirements: {
      mainStats: { str: 30 },
      skills: { melee: 30 },
    },
    distance: 2,
    attacksPerTurn: 1,
    damage: [16, 22],
    armorPiercing: 7,
    lethality: 0.6,
  },

  fireAxe: {
    templateId: 'fireAxe',
    type: 'meleeWeapon',
    price: 90,
    dropRate: 0.95,
    requirements: {
      mainStats: { str: 45 },
      skills: { melee: 25 },
    },
    distance: 1,
    attacksPerTurn: 1,
    damage: [18, 26],
    armorPiercing: 8,
    lethality: 0.75,
  },

  // --- RANGED WEAPONS ---

  beretta92: {
    templateId: 'beretta92',
    type: 'rangeWeapon',
    price: 250,
    dropRate: 0.95,
    requirements: {
      skills: { range: 25 },
    },
    distance: 2,
    attacksPerTurn: 2,
    damage: [10, 16],
    armorPiercing: 5,
    lethality: 0.55,
  },

  pumpShotgun: {
    templateId: 'pumpShotgun',
    type: 'rangeWeapon',
    price: 400,
    dropRate: 0.95,
    requirements: {
      mainStats: { str: 45 },
      skills: { range: 30 },
    },
    distance: 2,
    attacksPerTurn: 1,
    damage: [25, 45],
    armorPiercing: 3,
    mods: {
      // Используем структуру StatBlock для модов
      skills: { range: -20 },
    },
    lethality: 0.9,
  },

  makeshiftRifle: {
    templateId: 'makeshiftRifle',
    type: 'rangeWeapon',
    price: 350,
    dropRate: 0.95,
    requirements: {
      skills: { range: 35 },
    },
    distance: 3,
    attacksPerTurn: 1,
    damage: [16, 32],
    armorPiercing: 7,
    lethality: 0.7,
  },

  crossbow: {
    templateId: 'crossbow',
    type: 'rangeWeapon',
    price: 150,
    dropRate: 0.95,
    requirements: {
      mainStats: { str: 35 },
      skills: { range: 30 },
    },
    distance: 2,
    attacksPerTurn: 1,
    damage: [18, 22],
    armorPiercing: 12,
    lethality: 0.7,
  },
};
