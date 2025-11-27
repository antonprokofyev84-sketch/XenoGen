import type { Rarity } from './common.types';

export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

type Count = number | [number, number];

export interface LootEntry {
  itemId: string;
  quantity: Count;
  chance: number; // 0.0 - 1.0
}

export interface LootRule {
  tiers: Partial<Record<Rarity, LootEntry[]>>; // common/uncommon/rare/unique
  cascade: boolean; // если true — берём все уровни редкости до текущего включительно
}
