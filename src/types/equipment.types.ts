import type { ArmorInstance } from './armor.types';
import type { Rarity } from './common.types';
import type { WeaponInstance } from './weapon.types';

export interface EquipmentItem {
  templateId: string; // ID шаблона (например, 'makeshiftKnife')
  rarity: Rarity;
}

export type MeleeSlots = 'meleePrimary' | 'meleeSecondary';

export type RangeSlots = 'rangePrimary' | 'rangeSecondary';

export type WeaponSlots = MeleeSlots | RangeSlots;

export type EquipmentSlot = WeaponSlots | 'armor' | 'gadget';

export interface EquipmentSlots {
  meleePrimary: EquipmentItem | null;
  meleeSecondary: EquipmentItem | null;
  rangePrimary: EquipmentItem | null;
  rangeSecondary: EquipmentItem | null;
  armor: EquipmentItem | null;
  gadget: EquipmentItem | null;
}

export interface FullEquipment {
  meleePrimary: WeaponInstance | null;
  meleeSecondary: WeaponInstance | null;
  rangePrimary: WeaponInstance | null;
  rangeSecondary: WeaponInstance | null;
  armor: ArmorInstance | null;
  gadget: ArmorInstance | null;
}
