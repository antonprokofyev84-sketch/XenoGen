import type { Rarity } from './common.types';

export type ItemType =
  | 'meleeWeapon'
  | 'rangeWeapon'
  | 'armor'
  | 'gadget'
  | 'resource'
  | 'consumable'
  | 'misc';

export type ItemTypeFilter = ItemType[] | null;

export interface InventoryItem {
  templateId: string;
  type: ItemType;
  rarity: Rarity;
  quantity: number;
}

export interface InventoryContainer {
  items: InventoryItem[];
  money: number;
}
