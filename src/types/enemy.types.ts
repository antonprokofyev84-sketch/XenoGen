import type { Rarity } from './common.types';
import type { WeaponInstance } from './weapon.types';

export interface EnemyStats {
  hp: number;
  armor: number;
  baseMeleeDamage: number;
  melee: number;
  ranged: number;
  evasion: number;
  initiative: number;
  critChance: number;
}

// Упрощённый противник для runtime боя
export interface EnemyTemplate {
  id: string;
  templateId: string;
  appearanceVariation?: number;
  faction: string;
  rarity?: Rarity; // Rarity of the character itself (for capturing)

  baseLevel: number;
  tierScalingFactor?: number; // Defaults to 1.0 if not present
  baseStats: EnemyStats;

  weaponId: string;
  bodyArmorId?: string;

  // Optional tier override object
  tierOverrides?: {
    1?: EnemyStats;
    2?: EnemyStats;
  };
}

// Финальный объект врага, готовый для боя
export interface EnemyInstance {
  instanceId: string;
  templateId: string; // ID из ENEMY_TEMPLATES_DB, например 'youngScavenger'
  appearanceVariation: number;
  faction: string;
  level: number;
  rarity: Rarity;
  stats: EnemyStats;
  weapon: Omit<WeaponInstance, 'mods'>; // Полный объект оружия, но без модов (они уже учтены)
  bodyArmor?: {
    id: string;
    rarity: Rarity;
  };
}
