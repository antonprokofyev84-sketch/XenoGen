import type { Level, LootRule } from '@/types/loot.types';

export const LOOT_RULES: Record<string, Partial<Record<Level, LootRule>>> = {
  scavengers: {
    1: {
      baseLoot: [
        { itemId: 'scrap', count: [3, 6], chance: 1.0 },
        { itemId: 'coins', count: [1, 3], chance: 0.5 },
      ],
      rarityBonusLoot: {
        uncommon: [{ itemId: 'bullets_9mm', count: [5, 10], chance: 0.5 }],
        rare: [{ itemId: 'medkit_small', count: 1, chance: 0.75 }],
        unique: [
          { itemId: 'medkit_small', count: 1, chance: 1.0 },
          { itemId: 'weapon_part_rare', count: 1, chance: 0.5 },
        ],
      },
      cascadeBonuses: true,
    },
    2: {
      baseLoot: [],
      rarityBonusLoot: { uncommon: [], rare: [], unique: [] },
      cascadeBonuses: true,
    },
    3: {
      baseLoot: [],
      rarityBonusLoot: { uncommon: [], rare: [], unique: [] },
      cascadeBonuses: true,
    },
    4: {
      baseLoot: [],
      rarityBonusLoot: { uncommon: [], rare: [], unique: [] },
      cascadeBonuses: true,
    },
    5: {
      baseLoot: [],
      rarityBonusLoot: { uncommon: [], rare: [], unique: [] },
      cascadeBonuses: true,
    },
  },
};
