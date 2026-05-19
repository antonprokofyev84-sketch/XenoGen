/**
 * Main barrel export for POI types.
 */

// Common types
export type {
  CellTerrain,
  PoiType,
  GeneralDetails,
  BasePoiNode,
  InitialBasePoiNode,
} from './common';

export type { RegionParameters } from './regionParameters';

// Effects & triggers
export type {
  CellParam,
  PoiAction,
  PoiTriggerRule,
  PoiTemplateTriggers,
  EffectsMap,
} from './effects';

// Cell
export type { CellDetails, CellPoiNode, InitialCellDetails, InitialCellPoiNode } from './cell';

// Nodes
export type {
  PoiNode,
  NonCellNode,
  NonCellPoiNode,
  UniversalPoiDetails,
  PoiDetails,
} from './nodes';
export { isCell, isNonCell } from './nodes';

// Templates
export type { PoiTemplate } from './templates';

// Initial
export type { InitialPoi } from './initial';
