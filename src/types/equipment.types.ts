import type { InventoryItem } from './inventory.types';

export type MeleeSlots = 'meleePrimary' | 'meleeSecondary';

export type RangeSlots = 'rangePrimary' | 'rangeSecondary';

export type WeaponSlots = MeleeSlots | RangeSlots;

export type EquipmentSlot = WeaponSlots | 'armor' | 'gadget';

export interface EquipmentSlots {
  meleePrimary: InventoryItem | null;
  meleeSecondary: InventoryItem | null;
  rangePrimary: InventoryItem | null;
  rangeSecondary: InventoryItem | null;
  armor: InventoryItem | null;
  gadget: InventoryItem | null;
}
