import {
  BASE_TRAVEL_COST,
  MOVEMENT_MODE_RULES,
  TERRAIN_RULES,
  TOD_RULES,
  WEATHER_RULES,
} from '@/data/travel.rules';
import type { CellType } from '@/types/map.types';
import type { MovementMode } from '@/types/travel.types';
import type { ToD, Weather } from '@/types/world.types';

const DIAGONAL_MULT = 1.4;
const FATIGUE_MULT = 1.3;

type Adjacency = {
  isAdjacent: boolean;
  isDiagonal: boolean;
};

export const getAdjacency = (cellId1: string, cellId2: string): Adjacency => {
  const [col1, row1] = cellId1.split('-').map(Number);
  const [col2, row2] = cellId2.split('-').map(Number);
  const dx = Math.abs(col1 - col2);
  const dy = Math.abs(row1 - row2);

  if (dx === 0 && dy === 0) return { isAdjacent: false, isDiagonal: false };

  return { isAdjacent: dx <= 1 && dy <= 1, isDiagonal: dx === 1 && dy === 1 };
};

type TravelCost = {
  currentCellId: string;
  targetCellId: string;
  terrain: CellType;
  weather?: Weather;
  timeOfDay?: ToD;
  mode?: MovementMode;
  isFatigued?: boolean;
};

export const TravelManager = {
  computeTravelCost: ({
    currentCellId,
    targetCellId,
    terrain,
    weather = 'clear',
    timeOfDay = 'day',
    mode = 'foot',
    isFatigued = false,
  }: TravelCost) => {
    const { isAdjacent, isDiagonal } = getAdjacency(currentCellId, targetCellId);
    if (!isAdjacent) {
      return { passable: false as const, stamina: Infinity, minutes: Infinity };
    }

    const baseMultiplier = isDiagonal ? DIAGONAL_MULT : 1;
    const fatigueMultiplier = isFatigued ? FATIGUE_MULT : 1;

    const rule = TERRAIN_RULES[terrain];
    const weatherRule = WEATHER_RULES[weather];
    const todRule = TOD_RULES[timeOfDay];
    const movementRule = MOVEMENT_MODE_RULES[mode];

    if (!rule.passable?.[mode]) {
      return { passable: false as const, stamina: Infinity, minutes: Infinity };
    }

    let stamina = Math.ceil(
      BASE_TRAVEL_COST.stamina *
        rule.staminaMult *
        baseMultiplier *
        weatherRule.staminaMult *
        todRule.staminaMult *
        movementRule.staminaMult,
    );
    let minutes = Math.ceil(
      BASE_TRAVEL_COST.minutes *
        rule.timeMult *
        baseMultiplier *
        fatigueMultiplier *
        weatherRule.timeMult *
        todRule.timeMult *
        movementRule.timeMult,
    );

    return { passable: true as const, stamina, minutes };
  },
};
