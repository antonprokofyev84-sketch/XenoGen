import type { CombatUnit } from './combat.types';

// export type TravelMode = 'normal' | 'stealth' | 'fast';

export type Captive = Pick<
  CombatUnit,
  'id' | 'templateId' | 'level' | 'faction' | 'appearanceVariation' | 'rarity'
>;
