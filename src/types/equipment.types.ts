import type { ArmorInstance } from './armor.types';
import type { Rarity } from './common.types';
import type { WeaponInstance } from './weapon.types';

export interface EquipmentItem {
  templateId: string; // ID шаблона (например, 'makeshiftKnife')
  rarity: Rarity;
}

export type EquipmentSlot = 'melee' | 'ranged' | 'armor' | 'outerwear' | 'accessory';

export interface EquipmentSlots {
  melee: EquipmentItem | null;
  ranged: EquipmentItem | null;
  armor: EquipmentItem | null;
  outerwear: EquipmentItem | null;
  accessory: EquipmentItem | null;
}

export interface FullEquipment {
  melee: WeaponInstance | null;
  ranged: WeaponInstance | null;
  armor: ArmorInstance | null;
  outerwear: ArmorInstance | null;
  accessory: ArmorInstance | null;
}
