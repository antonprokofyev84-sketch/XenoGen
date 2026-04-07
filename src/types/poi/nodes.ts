/**
 * POI Node типы: union всех типов и type-guards.
 */
import type { CellPoiNode } from './cell';
import type { EncounterPoiNode } from './encounter';
import type { FacilityPoiNode } from './facility';
import type { GenericPoiNode } from './generic';
import type { SpotPoiNode } from './spot';

/**
 * Полный союз всех POI node типов.
 */
export type PoiNode =
  | CellPoiNode
  | EncounterPoiNode
  | FacilityPoiNode
  | SpotPoiNode
  | GenericPoiNode;

/**
 * Всё кроме cell — для sub-POI операций.
 */
export type NonCellNode = Exclude<PoiNode, CellPoiNode>;

/**
 * Union для details. Автоматически обновляется при добавлении новых типов в PoiNode.
 */
export type PoiDetails = PoiNode['details'];

// ============================================================
// TYPE GUARDS
// ============================================================

export function isCell(poi: PoiNode): poi is CellPoiNode {
  return poi.type === 'cell';
}

export function isEncounter(poi: PoiNode): poi is EncounterPoiNode {
  return poi.type === 'encounter';
}

export function isFacility(poi: PoiNode): poi is FacilityPoiNode {
  return poi.type === 'facility';
}

export function isSpot(poi: PoiNode): poi is SpotPoiNode {
  return poi.type === 'spot';
}

export function isGeneric(poi: PoiNode): poi is GenericPoiNode {
  return (
    poi.type === 'loot' ||
    poi.type === 'dungeon' ||
    poi.type === 'settlement' ||
    poi.type === 'base' ||
    poi.type === 'boss' ||
    poi.type === 'quest'
  );
}

export function isNonCell(poi: PoiNode): poi is NonCellNode {
  return poi.type !== 'cell';
}
