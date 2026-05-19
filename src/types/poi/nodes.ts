/**
 * POI Node типы: union всех типов и type-guards.
 */
import type { CombatUnit } from '../combat.types';
import type { CellPoiNode } from './cell';
import type { BasePoiNode, GeneralDetails } from './common';
import type { RegionParameters } from './regionParameters';

// ============================================================
// UNIVERSAL NON-CELL NODE
// ============================================================

/**
 * Unified details bag for all non-cell POI nodes.
 * `type` on the node itself is the content key (template id).
 */
export interface UniversalPoiDetails extends GeneralDetails {
  isDiscovered: boolean;
  explorationThreshold: number;
  ownerId?: string;
  faction?: string;
  level?: number;
  lifetimeDays?: number | null;
  combatUnits?: CombatUnit[] | null;
  store?: any | null;
  requiresOwner?: boolean;
  /** Overrides specific region parameters for this POI, relative to the root cell. */
  regionParametersOverride?: Partial<RegionParameters>;
  /** Additive modifiers applied on top of the resolved override. Clamped to 0 minimum. */
  regionParameterModifiers?: Partial<RegionParameters>;
}

/**
 * Universal non-cell POI node. `type` is the template/content key (e.g. "scavenger_group").
 */
export interface NonCellPoiNode extends BasePoiNode {
  type: string;
  details: UniversalPoiDetails;
}

/**
 * Полный союз всех POI node типов.
 */
export type PoiNode = CellPoiNode | NonCellPoiNode;

/**
 * Всё кроме cell — для sub-POI операций.
 */
export type NonCellNode = NonCellPoiNode;

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

export function isNonCell(poi: PoiNode): poi is NonCellPoiNode {
  return poi.type !== 'cell';
}
