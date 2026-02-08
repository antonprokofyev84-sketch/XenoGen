import type { CombatUnit } from './combat.types';

export type CellTerrain = 'forest' | 'mountain' | 'plain' | 'desert' | 'water' | 'ruins';

interface GeneralDetails {
  lastTimeVisited?: number | null;
}

export interface CellDetails extends GeneralDetails {
  // позиция в сетке (для UI и поиска соседей)
  col: number;
  row: number;

  terrain: CellTerrain;

  // 0..999 или 1000 для 10-го уровня (макс) уровень вычисляется как Math.floor(threat / 100)
  // для contamination и prosperity аналогично
  threat: number;
  contamination: number;
  prosperity: number;

  visitedTimes: number; // сколько раз игрок реально заходил в клетку

  // "сила" разведки, которая влияет на видимость POI в клетке
  // возможно имеет смысл добавить еще одно поле
  // которое будет отвечать за "максимальный уровень разведки, достигнутый когда-либо"
  // а текущий уровень будет зависеть  от половины максимального и восприятия персонажей
  explorationLevel: number;

  /**
   * 0     -> не разведана сейчас
   * > 0   -> временно разведана ещё N дней или постоянно разведана (Infinity)
   */
  explorationDaysLeft: number;
}

export interface EncounterDetails extends GeneralDetails {
  poiTemplateId: string;

  faction?: string;
  ownerId?: string;

  explorationThreshold: number;

  level?: number;

  progress?: number;
  progressMax?: number;

  isDiscovered: boolean;
  lifetimeDays?: number | null;

  combatUnits?: CombatUnit[] | null;
  store?: any | null;
}

export type PoiType =
  | 'cell'
  | 'encounter'
  | 'loot'
  | 'facility'
  | 'dungeon'
  | 'settlement'
  | 'base'
  | 'boss'
  | 'quest';

export type PoiDetails = CellDetails | EncounterDetails | Record<string, any>;

// =====================
// POI Nodes (discriminated union)
// =====================

export interface BasePoiNode {
  id: string;
  parentId: string | null; // null = корень (ячейка)
  childrenIds: string[];
  rootCellId: string;
}

export interface CellPoiNode extends BasePoiNode {
  type: 'cell';
  details: CellDetails;
}

export interface EncounterPoiNode extends BasePoiNode {
  type: 'encounter';
  details: EncounterDetails;
}

/**
 * Все остальные типы POI пока типизируем как "generic".
 * Когда конкретный тип начнёт активно использоваться в UI/логике — выделяешь ему свой Details
 * и добавляешь в union ниже.
 */
export interface GenericPoiNode extends BasePoiNode {
  type: 'loot' | 'facility' | 'dungeon' | 'settlement' | 'base' | 'boss' | 'quest';
  details: Record<string, any>;
}

export type PoiNode = CellPoiNode | EncounterPoiNode | GenericPoiNode;
export type NonCellNode = EncounterPoiNode | GenericPoiNode;
