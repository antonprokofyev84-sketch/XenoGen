import type { Rarity } from '@/types/common.types';

export const PROTAGONIST_ID = 'protagonist';

export const GRID_COLS = 10;
export const GRID_ROWS = 10;
export const CELL_SIZE = 100; // pixels

export const DEFAULT_EXPLORATION_DURATION = 6;

export const STAMINA_RECOVERY_PER_HOUR = 10; // Amount of stamina recovered per hour of rest

export const DEFAULT_ARMOR_ID = 'regularCloth';
export const DEFAULT_MELEE_ID = 'fists';

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'unique'];
export const START_DATE = new Date('2069-05-10T08:00:00').getTime();
export const DEFAULT_VISIT_DATE = new Date('2069-01-01T08:00:00').getTime();
