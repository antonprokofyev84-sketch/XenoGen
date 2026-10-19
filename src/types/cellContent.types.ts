import type { RemainingDays } from './common.types';
import type { CellId } from './ids.types';
import type { RegionParameters } from './region.types';

/**
 * Контракт авторских клеток фиксированной карты.
 *
 * Initial-клетка хранит только авторские данные. Производные значения
 * добавляет инициализатор: `parentId: null`, `rootCellId === id`, координаты
 * из `id` и пустой `childPoiIds`.
 */

export type CellTerrain = 'forest' | 'mountain' | 'plain' | 'desert' | 'water' | 'ruins';

export interface InitialCellDetails {
  terrain: CellTerrain;

  /** Полный набор raw-значений `0..999`; дробные допускаются. */
  regionParameters: RegionParameters;

  /** Отсутствие означает `0`. */
  visitedTimes?: number;

  /** Отсутствие означает `null`. */
  lastTimeVisited?: number | null;

  /** Отсутствие означает `0`. */
  explorationLevel?: number;

  /**
   * Актуальность разведданных. Отсутствие означает `0`: клетка не разведана.
   * Это отличается от POI, где отсутствие `lifetimeDaysLeft` означает `null`.
   */
  explorationDaysLeft?: RemainingDays;
}

export interface InitialCell {
  id: CellId;
  details: InitialCellDetails;
}

/** У клетки нет `isDiscovered`: клетки фиксированной карты всегда видны. */
export type InitialCellList = readonly InitialCell[];
