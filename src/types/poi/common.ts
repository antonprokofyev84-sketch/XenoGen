/**
 * Общие типы для всех POI.
 */

export type CellTerrain = 'forest' | 'mountain' | 'plain' | 'desert' | 'water' | 'ruins';

export type PoiType =
  | 'cell'
  | 'encounter'
  | 'facility'
  | 'spot'
  | 'loot'
  | 'dungeon'
  | 'settlement'
  | 'base'
  | 'boss'
  | 'quest';

/**
 * Базовые поля всех POI details (независимо от типа).
 */
export interface GeneralDetails {
  lastTimeVisited?: number | null;
}

export interface BasePoiNode {
  id: string;
  parentId: string | null; // null = корень (ячейка)
  childrenIds: string[];
  rootCellId: string;
}

/**
 * Базовый тип для initial POI (без childrenIds, потому что дети строятся автоматически).
 */
export type InitialBasePoiNode = Omit<BasePoiNode, 'childrenIds'>;
