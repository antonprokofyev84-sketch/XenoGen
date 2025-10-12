import type { Rarity } from './common.types';

export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type Count = number | [number, number];

interface LootEntry {
  itemId: string;
  count: Count;
  chance: number; // 0.0 - 1.0
}

export interface LootRule {
  baseLoot: LootEntry[];
  rarityBonusLoot?: Partial<Record<Exclude<Rarity, 'common'>, LootEntry[]>>;
  cascadeBonuses?: boolean; // по умолчанию true: unique включает rare+uncommon
}
