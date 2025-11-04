// data/lootRulesByTemplate.ts
import type { LootRule } from '@/types/loot.types';

export const LEVEL_BONUS = [1, 1.25, 1.5]; // как и было

export const LOOT_RULES_BY_TEMPLATE: Record<string, LootRule> = {
  youngScavenger: {
    tiers: {
      common: [
        { itemId: 'scrap', count: [2, 5], chance: 1.0 },
        { itemId: 'coins', count: [1, 2], chance: 0.4 },
        { itemId: 'cloth_patch', count: [1, 2], chance: 0.35 },
      ],
      uncommon: [
        { itemId: 'bandage', count: [1, 2], chance: 0.5 },
        { itemId: 'weapon_part_common', count: 1, chance: 0.25 },
      ],
      rare: [{ itemId: 'medkit_small', count: 1, chance: 0.2 }],
      unique: [{ itemId: 'weapon_part_rare', count: 1, chance: 0.15 }],
    },
    cascade: true,
  },

  oldScavenger: {
    tiers: {
      common: [
        { itemId: 'scrap', count: [3, 6], chance: 1.0 },
        { itemId: 'coins', count: [1, 3], chance: 0.5 },
        { itemId: 'cloth_patch', count: [1, 3], chance: 0.45 },
        { itemId: 'bone_shard', count: [1, 2], chance: 0.3 },
      ],
      uncommon: [
        { itemId: 'bandage', count: [1, 2], chance: 0.6 },
        { itemId: 'weapon_part_common', count: 1, chance: 0.35 },
      ],
      rare: [
        { itemId: 'medkit_small', count: 1, chance: 0.25 },
        { itemId: 'weapon_part_rare', count: 1, chance: 0.15 },
      ],
      unique: [{ itemId: 'talisman_old_world', count: 1, chance: 0.1 }],
    },
    cascade: true,
  },

  scavengerStalker: {
    tiers: {
      common: [
        { itemId: 'scrap', count: [3, 6], chance: 1.0 },
        { itemId: 'coins', count: [1, 3], chance: 0.5 },
        { itemId: 'bolt_crossbow', count: [3, 7], chance: 0.7 },
      ],
      uncommon: [
        { itemId: 'bandage', count: [1, 2], chance: 0.45 },
        { itemId: 'weapon_part_common', count: 1, chance: 0.35 },
      ],
      rare: [{ itemId: 'medkit_small', count: 1, chance: 0.25 }],
      unique: [{ itemId: 'weapon_part_rare', count: 1, chance: 0.15 }],
    },
    cascade: true,
  },

  scavengerScout: {
    tiers: {
      common: [
        { itemId: 'scrap', count: [3, 6], chance: 1.0 },
        { itemId: 'coins', count: [1, 4], chance: 0.6 },
        { itemId: 'bullets_9mm', count: [6, 12], chance: 0.75 },
      ],
      uncommon: [
        { itemId: 'bandage', count: [1, 2], chance: 0.5 },
        { itemId: 'weapon_part_common', count: 1, chance: 0.4 },
      ],
      rare: [
        { itemId: 'medkit_small', count: 1, chance: 0.3 },
        { itemId: 'ammo_box_pistol', count: 1, chance: 0.2 },
      ],
      unique: [{ itemId: 'weapon_part_rare', count: 1, chance: 0.2 }],
    },
    cascade: true,
  },

  scavengerMarksman: {
    tiers: {
      common: [
        { itemId: 'scrap', count: [4, 8], chance: 1.0 },
        { itemId: 'coins', count: [2, 5], chance: 0.7 },
        { itemId: 'rifle_round', count: [8, 16], chance: 0.8 },
      ],
      uncommon: [
        { itemId: 'bandage', count: [1, 2], chance: 0.55 },
        { itemId: 'weapon_part_common', count: 1, chance: 0.45 },
      ],
      rare: [
        { itemId: 'medkit_small', count: 1, chance: 0.35 },
        { itemId: 'ammo_box_rifle', count: 1, chance: 0.25 },
      ],
      unique: [
        { itemId: 'weapon_part_rare', count: 1, chance: 0.25 },
        { itemId: 'blueprint_fragment', count: 1, chance: 0.15 },
      ],
    },
    cascade: true,
  },
};
