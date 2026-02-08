import {
  BASE_CELL_TO_CELL,
  CELL_TO_POI_ENTER,
  DIAGONAL_MULTIPLIER,
  INNER_POI_MOVE,
  SETTLEMENT_MOVE,
} from '@/data/travel.rules';
import type { StoreState } from '@/state/useGameState';
import type { CellType } from '@/types/map.types';
import type { PoiNode } from '@/types/poi.types';
import type { MovementMode } from '@/types/travel.types';
import type { ToD, Weather } from '@/types/world.types';

type Adjacency = {
  isAdjacent: boolean;
  isDiagonal: boolean;
};

function getAdjacency(firstCellId: string, secondCellId: string): Adjacency {
  const [firstColumn, firstRow] = firstCellId.split('-').map(Number);
  const [secondColumn, secondRow] = secondCellId.split('-').map(Number);

  const deltaX = Math.abs(firstColumn - secondColumn);
  const deltaY = Math.abs(firstRow - secondRow);

  if (deltaX === 0 && deltaY === 0) {
    return { isAdjacent: false, isDiagonal: false };
  }

  return {
    isAdjacent: deltaX <= 1 && deltaY <= 1,
    isDiagonal: deltaX === 1 && deltaY === 1,
  };
}

export type TravelResult = {
  canTravel: boolean;
  staminaCost: number;
  timeCost: number; // minutes
};

function getPoiById(state: StoreState, poiId: string): PoiNode | null {
  return state.poiSlice.pois[poiId] ?? null;
}

export const TravelManager = {
  computeTravel(currentPoiId: string, targetPoiId: string, state: StoreState): TravelResult {
    const currentPoi = getPoiById(state, currentPoiId);
    const targetPoi = getPoiById(state, targetPoiId);

    if (!currentPoi || !targetPoi) {
      return { canTravel: false, staminaCost: Infinity, timeCost: Infinity };
    }

    // 1) cell -> cell (глобальная карта). Оставляем только диагональ.
    if (currentPoi.type === 'cell' && targetPoi.type === 'cell') {
      const { isAdjacent, isDiagonal } = getAdjacency(currentPoi.id, targetPoi.id);

      if (!isAdjacent) {
        return { canTravel: false, staminaCost: Infinity, timeCost: Infinity };
      }

      const multiplier = isDiagonal ? DIAGONAL_MULTIPLIER : 1;

      return {
        canTravel: true,
        staminaCost: Math.ceil(BASE_CELL_TO_CELL.staminaCost * multiplier),
        timeCost: Math.ceil(BASE_CELL_TO_CELL.timeCost * multiplier),
      };
    }

    // 2) cell -> любой POI (вход “с карты в точку”)
    if (currentPoi.type === 'cell' && targetPoi.type !== 'cell') {
      return { canTravel: true, ...CELL_TO_POI_ENTER };
    }

    // 3) Если мы “в поселении”, любое перемещение стоит одинаково (и внутрь, и наружу).
    if (currentPoi.type === 'settlement') {
      return { canTravel: true, ...SETTLEMENT_MOVE };
    }

    // 4) Любой другой POI (encounter/facility/dungeon/...) — “переход по комнатам / выход”
    return { canTravel: true, ...INNER_POI_MOVE };
  },
};

// type TravelCost = {
//   currentCellId: string;
//   targetCellId: string;
//   terrain: CellType;
//   weather?: Weather;
//   timeOfDay?: ToD;
//   mode?: MovementMode;
//   isFatigued?: boolean;
// };

// export const TravelManager = {
//   computeTravelCost: ({
//     currentCellId,
//     targetCellId,
//     terrain,
//     weather = 'clear',
//     timeOfDay = 'day',
//     mode = 'foot',
//     isFatigued = false,
//   }: TravelCost) => {
//     const { isAdjacent, isDiagonal } = getAdjacency(currentCellId, targetCellId);
//     if (!isAdjacent) {
//       return { passable: false as const, stamina: Infinity, minutes: Infinity };
//     }

//     const baseMultiplier = isDiagonal ? DIAGONAL_MULT : 1;
//     const fatigueMultiplier = isFatigued ? FATIGUE_MULT : 1;

//     const rule = TERRAIN_RULES[terrain];
//     const weatherRule = WEATHER_RULES[weather];
//     const todRule = TOD_RULES[timeOfDay];
//     const movementRule = MOVEMENT_MODE_RULES[mode];

//     if (!rule.passable?.[mode]) {
//       return { passable: false as const, stamina: Infinity, minutes: Infinity };
//     }

//     let stamina = Math.ceil(
//       BASE_TRAVEL_COST.stamina *
//         rule.staminaMult *
//         baseMultiplier *
//         weatherRule.staminaMult *
//         todRule.staminaMult *
//         movementRule.staminaMult,
//     );
//     let minutes = Math.ceil(
//       BASE_TRAVEL_COST.minutes *
//         rule.timeMult *
//         baseMultiplier *
//         fatigueMultiplier *
//         weatherRule.timeMult *
//         todRule.timeMult *
//         movementRule.timeMult,
//     );

//     return { passable: true as const, stamina, minutes };
//   },
// };
