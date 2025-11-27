// data/lootRulesByTemplate.ts
import type { LootRule } from '@/types/loot.types';

export const LEVEL_BONUS = [1, 1.25, 1.5]; // как и было

export const LOOT_RULES_BY_TEMPLATE: Record<string, LootRule> = {
  youngScavenger: {
    tiers: {
      common: [
        { itemId: 'scrap', quantity: [2, 5], chance: 1.0 },
        { itemId: 'money', quantity: [1, 2], chance: 1.0 }, // 0.4
        { itemId: 'food', quantity: [1, 2], chance: 1.0 }, // 0.4
        { itemId: 'cloth_patch', quantity: [1, 2], chance: 0.35 },
      ],
      uncommon: [
        { itemId: 'bandage', quantity: [1, 2], chance: 0.5 },
        { itemId: 'weapon_part', quantity: 1, chance: 0.25 },
      ],
      rare: [{ itemId: 'medkit_small', quantity: 1, chance: 0.2 }],
      unique: [{ itemId: 'weapon_part', quantity: 1, chance: 0.15 }],
    },
    cascade: true,
  },

  oldScavenger: {
    tiers: {
      common: [
        { itemId: 'scrap', quantity: [3, 6], chance: 1.0 },
        { itemId: 'money', quantity: [1, 3], chance: 0.5 },
        { itemId: 'cloth_patch', quantity: [1, 3], chance: 0.45 },
        { itemId: 'bone_shard', quantity: [1, 2], chance: 0.3 },
      ],
      uncommon: [
        { itemId: 'bandage', quantity: [1, 2], chance: 0.6 },
        { itemId: 'weapon_part', quantity: 1, chance: 0.35 },
      ],
      rare: [
        { itemId: 'medkit_small', quantity: 1, chance: 0.25 },
        { itemId: 'weapon_part', quantity: 1, chance: 0.15 },
      ],
      unique: [{ itemId: 'talisman_old_world', quantity: 1, chance: 0.1 }],
    },
    cascade: true,
  },

  scavengerStalker: {
    tiers: {
      common: [
        { itemId: 'scrap', quantity: [3, 6], chance: 1.0 },
        { itemId: 'money', quantity: [1, 3], chance: 0.5 },
        { itemId: 'bolt_crossbow', quantity: [3, 7], chance: 0.7 },
      ],
      uncommon: [
        { itemId: 'bandage', quantity: [1, 2], chance: 0.45 },
        { itemId: 'weapon_part_common', quantity: 1, chance: 0.35 },
      ],
      rare: [{ itemId: 'medkit_small', quantity: 1, chance: 0.25 }],
      unique: [{ itemId: 'weapon_part_rare', quantity: 1, chance: 0.15 }],
    },
    cascade: true,
  },

  scavengerScout: {
    tiers: {
      common: [
        { itemId: 'scrap', quantity: [3, 6], chance: 1.0 },
        { itemId: 'money', quantity: [1, 4], chance: 0.6 },
        { itemId: 'bullets_9mm', quantity: [6, 12], chance: 0.75 },
      ],
      uncommon: [
        { itemId: 'bandage', quantity: [1, 2], chance: 0.5 },
        { itemId: 'weapon_part_common', quantity: 1, chance: 0.4 },
      ],
      rare: [
        { itemId: 'medkit_small', quantity: 1, chance: 0.3 },
        { itemId: 'ammo_box_pistol', quantity: 1, chance: 0.2 },
      ],
      unique: [{ itemId: 'weapon_part_rare', quantity: 1, chance: 0.2 }],
    },
    cascade: true,
  },

  scavengerMarksman: {
    tiers: {
      common: [
        { itemId: 'scrap', quantity: [4, 8], chance: 1.0 },
        { itemId: 'money', quantity: [2, 5], chance: 0.7 },
        { itemId: 'rifle_round', quantity: [8, 16], chance: 0.8 },
      ],
      uncommon: [
        { itemId: 'bandage', quantity: [1, 2], chance: 0.55 },
        { itemId: 'weapon_part_common', quantity: 1, chance: 0.45 },
      ],
      rare: [
        { itemId: 'medkit_small', quantity: 1, chance: 0.35 },
        { itemId: 'ammo_box_rifle', quantity: 1, chance: 0.25 },
      ],
      unique: [
        { itemId: 'weapon_part_rare', quantity: 1, chance: 0.25 },
        { itemId: 'blueprint_fragment', quantity: 1, chance: 0.15 },
      ],
    },
    cascade: true,
  },
};
