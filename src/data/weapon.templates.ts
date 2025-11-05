import type { WeaponTemplate } from '@/types/weapon.types';

// increase damage and ap
export const WEAPON_RARITY_MULTIPLIERS_DEFAULT = { uncommon: 1.1, rare: 1.2, unique: 1.3 };

// export const WEAPON_RARITY_MULTIPLIERS = {
//   uncommon: {
//     damage: 1.15,      // +15% урона
//     armorPiercing: 1.1, // +10% пробития
//     accuracy: 5,       // +5 к точности
//   },
//   rare: {
//     damage: 1.3,       // +30% урона
//     armorPiercing: 1.2, // +20% пробития
//     accuracy: 10,      // +10 к точности
//     critical: 5,       // +5% крит шанс
//   },
//   unique: {
//     damage: 1.5,       // +50% урона
//     armorPiercing: 1.3, // +30% пробития
//     accuracy: 15,      // +15 к точности
//     critical: 10,      // +10% крит шанс
//   }
// };

export const WEAPON_TEMPLATES_DB: Record<string, WeaponTemplate> = {
  // --- MELEE WEAPONS ---
  // fists: {
  //   templateId: 'fists',
  //   type: 'meleeWeapon',
  //   price: 0,
  //   dropRate: 0.0,
  //   requiredMelee: 0,
  //   distance: 1,
  //   attacksPerTurn: 1,
  //   damage: [2, 4],
  //   armorPiercing: 0,
  // },
  fists: {
    templateId: 'fists',
    type: 'meleeWeapon',
    price: 0,
    dropRate: 0.0,
    requiredMelee: 0,
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
    // dropRate: 0.5,
    dropRate: 0.95,
    requiredMelee: 15,
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
    // dropRate: 0.3,
    dropRate: 0.95,
    requiredStrength: 30,
    requiredMelee: 30,
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
    // dropRate: 0.3,
    dropRate: 0.95,
    requiredStrength: 45,
    requiredMelee: 25,
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
    // dropRate: 0.28,
    dropRate: 0.95,
    requiredRanged: 25,
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
    // dropRate: 0.2,
    dropRate: 0.95,
    requiredStrength: 45,
    requiredRanged: 30,
    distance: 2,
    attacksPerTurn: 1,
    damage: [25, 45],
    armorPiercing: 3,
    mods: {
      range: -20,
    },
    lethality: 0.9,
  },

  makeshiftRifle: {
    templateId: 'makeshiftRifle',
    type: 'rangeWeapon',
    price: 350,
    // dropRate: 0.25,
    dropRate: 0.95,
    requiredRanged: 35,
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
    // dropRate: 0.22,
    dropRate: 0.95,
    requiredStrength: 35,
    requiredRanged: 30,
    distance: 2,
    attacksPerTurn: 1,
    damage: [18, 22],
    armorPiercing: 12,
    lethality: 0.7,
  },
};
