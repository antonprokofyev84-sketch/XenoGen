import type { Rarity } from './common.types.js';
import type { EquipmentItem, WeaponSlots } from './equipment.types.js';
import type { WeaponInstance } from './weapon.types';

export interface CombatStats {
  hp: number;
  armor: number;
  baseMeleeDamage: number;
  melee: number;
  range: number;
  evasion: number;
  initiative: number;
  critChance: number;
}

export interface CombatEquipment {
  meleeWeapon: WeaponInstance | null;
  rangeWeapon: WeaponInstance | null;
  armor: EquipmentItem | null;
  gadget: EquipmentItem | null;
}

export type CombatUnitStatus = 'dead' | 'alive' | 'unconscious';

// Финальный объект врага, готовый для боя
export interface CombatUnit {
  instanceId: string;
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

export type CombatStatus = 'victory' | 'defeat' | 'fled' | 'ongoing';

export interface CombatResult {
  combatStatus: CombatStatus;
  loot: { id: string; quantity: number; rarity?: Rarity }[];
  capturedEnemies: { instanceId: string; templateId: string; rarity?: Rarity }[];
  characterMetrics: Record<string, CharacterCombatMetrics>;
}
