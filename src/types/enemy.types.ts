import type { CombatStats } from './combat.types';
import type { Rarity } from './common.types';

// темплейт врага из базы данных
export interface EnemyTemplate {
  id: string;
  templateId: string;
  appearanceVariation?: number;
  faction: string;
  rarity?: Rarity; // Rarity of the character itself (for capturing)

  baseLevel: number;
  tierScalingFactor?: number; // Defaults to 1.0 if not present
  baseStats: CombatStats;

  equipment: {
    meleeId?: string;
    rangeId?: string;
    armorId?: string;
    gadgetId?: string;
  };

  // Optional tier override object
  tierOverrides?: {
    1?: CombatStats;
    2?: CombatStats;
  };
}
