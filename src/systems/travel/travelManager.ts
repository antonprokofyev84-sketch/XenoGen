import {
  BASE_CELL_TO_CELL,
  CELL_TO_POI_ENTER,
  DIAGONAL_MULTIPLIER,
  INNER_SCENE_MOVE,
  LOCAL_SPOT_MOVE,
} from '@/data/travel.rules';
import type { StoreState } from '@/state/useGameState';
import { isCell, isNonCell } from '@/types/poi.types';
import type { CellPoiNode, PoiNode } from '@/types/poi.types';

type Adjacency = {
  isAdjacent: boolean;
  isDiagonal: boolean;
};

function getCellAdjacency(firstCell: CellPoiNode, secondCell: CellPoiNode): Adjacency {
  const deltaX = Math.abs(firstCell.details.col - secondCell.details.col);
  const deltaY = Math.abs(firstCell.details.row - secondCell.details.row);

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

function computeCellToCellTravel(currentPoi: CellPoiNode, targetPoi: CellPoiNode): TravelResult {
  const adjacency = getCellAdjacency(currentPoi, targetPoi);

  if (!adjacency.isAdjacent) {
    return { canTravel: false, staminaCost: Infinity, timeCost: Infinity };
  }

  const multiplier = adjacency.isDiagonal ? DIAGONAL_MULTIPLIER : 1;

  return {
    canTravel: true,
    staminaCost: Math.ceil(BASE_CELL_TO_CELL.staminaCost * multiplier),
    timeCost: Math.ceil(BASE_CELL_TO_CELL.timeCost * multiplier),
  };
}

function isMovingToDirectChild(currentPoi: PoiNode, targetPoi: PoiNode): boolean {
  return targetPoi.parentId === currentPoi.id;
}

function isMovingToDirectParent(currentPoi: PoiNode, targetPoi: PoiNode): boolean {
  return currentPoi.parentId === targetPoi.id;
}

function getTreeEdgeTravelResult(currentPoi: PoiNode, targetPoi: PoiNode): TravelResult {
  const movingToDirectChild = isMovingToDirectChild(currentPoi, targetPoi);
  const movingToDirectParent = isMovingToDirectParent(currentPoi, targetPoi);

  if (!movingToDirectChild && !movingToDirectParent) {
    return { canTravel: false, staminaCost: Infinity, timeCost: Infinity };
  }

  if (movingToDirectChild && isNonCell(targetPoi) && !targetPoi.details.isDiscovered) {
    return { canTravel: false, staminaCost: Infinity, timeCost: Infinity };
  }

  if (isCell(currentPoi) || isCell(targetPoi)) {
    return { canTravel: true, ...CELL_TO_POI_ENTER };
  }

  if (currentPoi.isLocalSpot === true || targetPoi.isLocalSpot === true) {
    return { canTravel: true, ...LOCAL_SPOT_MOVE };
  }

  return { canTravel: true, ...INNER_SCENE_MOVE };
}

export const TravelManager = {
  computeTravel(currentPoiId: string, targetPoiId: string, state: StoreState): TravelResult {
    const currentPoi = getPoiById(state, currentPoiId);
    const targetPoi = getPoiById(state, targetPoiId);

    if (!currentPoi || !targetPoi) {
      return { canTravel: false, staminaCost: Infinity, timeCost: Infinity };
    }

    if (isCell(currentPoi) && isCell(targetPoi)) {
      return computeCellToCellTravel(currentPoi, targetPoi);
    }

    return getTreeEdgeTravelResult(currentPoi, targetPoi);
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
//     timeOfDay = 'afternoon',
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
