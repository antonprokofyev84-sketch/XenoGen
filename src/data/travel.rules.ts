import type { CellType } from '@/types/map.types';
import type { MovementMode } from '@/types/travel.types';
import type { ToD, Weather } from '@/types/world.types';

export const BASE_CELL_TO_CELL = {
  staminaCost: 12,
  timeCost: 60, // minutes
};

export const CELL_TO_POI_ENTER = {
  staminaCost: 4,
  timeCost: 30, // minutes
};

export const SETTLEMENT_MOVE = {
  staminaCost: 1,
  timeCost: 15, // minutes
};

export const INNER_POI_MOVE = {
  staminaCost: 0,
  timeCost: 5, // minutes
};

export const DIAGONAL_MULTIPLIER = 1.4;
export const FATIGUE_MULTIPLIER = 1.3;

export interface BaseTravelRule {
  staminaMult: number;
  timeMult: number;
}

export interface TerrainRule extends BaseTravelRule {
  passable?: Partial<Record<MovementMode, boolean>>;
}

export const TERRAIN_RULES: Record<CellType, TerrainRule> = {
  plain: { staminaMult: 1.0, timeMult: 1.0, passable: { foot: true } },
  ruins: { staminaMult: 1.2, timeMult: 1.1, passable: { foot: true } },
  forest: { staminaMult: 1.4, timeMult: 1.2, passable: { foot: true } },
  desert: { staminaMult: 1.6, timeMult: 1.4, passable: { foot: true } },
  mountain: { staminaMult: 1.8, timeMult: 1.8, passable: { foot: true } },
  water: { staminaMult: 1.0, timeMult: 1.0, passable: { boat: true } },
} as const;

export const WEATHER_RULES: Record<Weather, BaseTravelRule> = {
  clear: { staminaMult: 1.0, timeMult: 1.0 },
  rain: { staminaMult: 1.1, timeMult: 1.1 },
  storm: { staminaMult: 1.3, timeMult: 1.3 },
};

export const TOD_RULES: Record<ToD, BaseTravelRule> = {
  morning: { staminaMult: 0.8, timeMult: 0.8 },
  day: { staminaMult: 1.0, timeMult: 1.0 },
  night: { staminaMult: 1.2, timeMult: 1.2 },
};

export const MOVEMENT_MODE_RULES: Record<MovementMode, BaseTravelRule> = {
  foot: { staminaMult: 1.0, timeMult: 1.0 },
  boat: { staminaMult: 0.5, timeMult: 0.5 },
  mount: { staminaMult: 0.8, timeMult: 0.8 },
  vehicle: { staminaMult: 0.4, timeMult: 0.4 },
};
