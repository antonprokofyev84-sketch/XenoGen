/**
 * Ячейка / Сектор карты.
 * Корневой узел для всех POI в данной локации.
 */
import type { BasePoiNode, CellTerrain, GeneralDetails, InitialBasePoiNode } from './common';
import type { RegionParameters } from './regionParameters';

export interface CellDetails extends GeneralDetails {
  // позиция в сетке (для UI и поиска соседей)
  col: number;
  row: number;

  terrain: CellTerrain;

  // Canonical grouped region parameters.
  regionParameters: RegionParameters;

  visitedTimes: number; // сколько раз игрок реально заходил в клетку

  // "сила" разведки, которая влияет на видимость POI в клетке
  explorationLevel: number;

  /**
   * 0     -> не разведана сейчас
   * > 0   -> временно разведана ещё N дней или постоянно разведана (Infinity)
   */
  explorationDaysLeft: number;
}

export interface CellPoiNode extends BasePoiNode {
  type: 'cell';
  details: CellDetails;
}

// ============================================================
// INITIAL DETAILS
// ============================================================

export type InitialCellDetails = Pick<CellDetails, 'col' | 'row' | 'terrain'> &
  Partial<Omit<CellDetails, 'col' | 'row' | 'terrain'>>;

export interface InitialCellPoiNode extends InitialBasePoiNode {
  type: 'cell';
  parentId: null;
  details: InitialCellDetails;
}
