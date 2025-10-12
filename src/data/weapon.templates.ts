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
  makeshiftKnife: {
    id: 'makeshiftKnife',
    slot: 'melee',
    price: 40,
    dropRate: 0.5,
    requiredMelee: 15,
    distance: 0,
    attacksPerTurn: 2,
    damage: [8, 12],
    armorPiercing: 3,
  },

  spear: {
    id: 'spear',
    slot: 'melee',
    price: 110,
    dropRate: 0.3,
    requiredStrength: 30,
    requiredMelee: 30,
    distance: 1,
    attacksPerTurn: 1,
    damage: [16, 22],
    armorPiercing: 7,
  },

  fireAxe: {
    id: 'fireAxe',
    slot: 'melee',
    price: 90,
    dropRate: 0.3,
    requiredStrength: 45,
    requiredMelee: 25,
    distance: 0,
    attacksPerTurn: 1,
    damage: [18, 26],
    armorPiercing: 8,
  },

  // --- RANGED WEAPONS ---

  beretta92: {
    id: 'beretta92',
    slot: 'range',
    price: 250,
    dropRate: 0.28,
    requiredRanged: 25,
    distance: 1,
    attacksPerTurn: 2,
    damage: [10, 16],
    armorPiercing: 5,
  },

  pumpShotgun: {
    id: 'pumpShotgun',
    slot: 'range',
    price: 400,
    dropRate: 0.2,
    requiredStrength: 45,
    requiredRanged: 30,
    distance: 1,
    attacksPerTurn: 1,
    damage: [25, 45],
    armorPiercing: 3,
    mods: {
      range: -20,
    },
  },

  makeshiftRifle: {
    id: 'makeshiftRifle',
    slot: 'range',
    price: 350,
    dropRate: 0.25,
    requiredRanged: 35,
    distance: 2,
    attacksPerTurn: 1,
    damage: [16, 32],
    armorPiercing: 7,
  },

  crossbow: {
    id: 'crossbow',
    slot: 'range',
    price: 300,
    dropRate: 0.22,
    requiredStrength: 35,
    requiredRanged: 30,
    distance: 1,
    attacksPerTurn: 1,
    damage: [18, 22],
    armorPiercing: 12,
  },
};
