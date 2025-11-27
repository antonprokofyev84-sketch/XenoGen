import type { Rarity } from './common.types';

export type ItemType = 'meleeWeapon' | 'rangeWeapon' | 'armor' | 'gadget' | 'consumable' | 'misc';

export interface InventoryItem {
  templateId: string;
  type: ItemType;
  rarity: Rarity;
  quantity: number;
}

export interface Resources {
  money: number;
  scrap: number;
  food: number;
}

export type InventoryStorage = Record<ItemType, InventoryItem[]>;

export type CombatLoot = {
  items: InventoryItem[];
  resources: Resources;
};
