import type { Rarity } from './common.types';

export type ItemType =
  | 'meleeWeapon'
  | 'rangeWeapon'
  | 'armor'
  | 'gadget'
  | 'resource'
  | 'consumable'
  | 'misc';

export interface InventoryItem {
  templateId: string;
  type: ItemType;
  rarity: Rarity;
  quantity: number;
}

export type InventoryStorage = Record<ItemType, InventoryItem[]>;

export interface InventoryContainer {
  items: InventoryStorage;
  money: number;
}
