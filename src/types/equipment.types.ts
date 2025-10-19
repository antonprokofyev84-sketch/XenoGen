import type { ArmorInstance } from './armor.types';
import type { Rarity } from './common.types';
import type { WeaponInstance } from './weapon.types';

export interface EquipmentItem {
  templateId: string; // ID шаблона (например, 'makeshiftKnife')
  rarity: Rarity;
}

export type WeaponSlots = 'meleeWeapon' | 'rangeWeapon';

export type EquipmentSlot = WeaponSlots | 'armor' | 'gadget';

export interface EquipmentSlots {
  meleeWeapon: EquipmentItem | null;
  rangeWeapon: EquipmentItem | null;
  armor: EquipmentItem | null;
  gadget: EquipmentItem | null;
}

export interface FullEquipment {
  meleeWeapon: WeaponInstance | null;
  rangeWeapon: WeaponInstance | null;
  armor: ArmorInstance | null;
  gadget: ArmorInstance | null;
}
