import type { Rarity } from './common.types';
import type { WeaponSlots } from './equipment.types';
import type { InventoryItem } from './inventory.types';
import type { EffectLog } from './logs.types';
import type { WeaponInstance } from './weapon.types';

export interface CombatStats {
  hp: number;
  armor: number;
  meleeAttackPower: number;
  melee: number;
  range: number;
  evasion: number;
  initiative: number;
  critChance: number;
}

export interface CombatEquipment {
  meleePrimary: WeaponInstance | null;
  meleeSecondary: WeaponInstance | null;
  rangePrimary: WeaponInstance | null;
  rangeSecondary: WeaponInstance | null;
  armor: InventoryItem | null;
  gadget: InventoryItem | null;
}

export type CombatUnitStatus = 'dead' | 'alive' | 'unconscious';

// Финальный объект врага, готовый для боя
export interface CombatUnit {
  id: string;
  templateId: string; // ID из ENEMY_TEMPLATES_DB, например 'youngScavenger'
  appearanceVariation: number;
  faction: string;
  level: number;
  rarity: Rarity;
  stats: CombatStats;
  status: CombatUnitStatus;
  position: 0 | 1 | 2 | 3; // линия боя. возможно лучше использовать просто 0 1 зеркально.
  equipment: CombatEquipment;
  activeWeaponSlot: WeaponSlots;
}

export interface AttackStatistic {
  attacksMade: number;
  hits: number;
  misses: number;
  crits: number;
  totalDamageDealt: number;
}

export interface CharacterCombatMetrics {
  melee: AttackStatistic;
  range: AttackStatistic;
  kills: number;

  // Защитная статистика
  damageTaken: number;
  hitsReceived: number;
  hitsEvaded: number;
  critsReceived: number;
}

export type CombatStatus = 'victory' | 'defeat' | 'retreat' | 'ongoing';

export type CharacterMetrics = Record<string, CharacterCombatMetrics>;
export type CharacterUpdates = Record<string, EffectLog[]> | null;

export interface CombatResult {
  combatStatus: CombatStatus;
  characterMetrics: CharacterMetrics;
}

export type LootItem = {
  id: string;
  quantity: number;
  rarity?: Rarity;
};

export interface AggregatedLootResult {
  weapons: LootItem[];
  armors: LootItem[];
  gadgets: LootItem[];
  items: LootItem[];
  money: LootItem;
  scrap: LootItem;
}
