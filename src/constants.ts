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

export const TIME_OF_DAY_IDS = [
	'late_night',
	'early_morning',
	'morning',
	'afternoon',
	'evening',
	'night',
] as const;

export type TimeOfDayId = (typeof TIME_OF_DAY_IDS)[number];

export const HOURS_PER_TIME_SLOT = 4;
export const TIME_OF_DAY_SLOT_COUNT = TIME_OF_DAY_IDS.length;

export const TIME_OF_DAY_START_HOURS: Record<TimeOfDayId, number> = {
	late_night: 0,
	early_morning: 4,
	morning: 8,
	afternoon: 12,
	evening: 16,
	night: 20,
};
