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

// Shared detail fragments
export type {
  TemplatedDetails,
  OwnableDetails,
  DiscoverableDetails,
  CommonNonCellDetails,
  InitialOf,
} from './shared';

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

// Encounter
export type { EncounterDetails, EncounterPoiNode } from './encounter';
export type { InitialEncounterDetails, InitialEncounterPoiNode } from './encounter';

// Facility
export type { FacilityDetails, FacilityPoiNode } from './facility';
export type { InitialFacilityDetails, InitialFacilityPoiNode } from './facility';

// Spot
export type { SpotDetails, SpotPoiNode } from './spot';
export type { InitialSpotDetails, InitialSpotPoiNode } from './spot';

// Generic
export type { GenericPoiNode } from './generic';
export type { InitialGenericPoiNode } from './generic';

// Nodes
export type { PoiNode, NonCellNode, PoiDetails } from './nodes';
export { isCell, isEncounter, isFacility, isSpot, isGeneric, isNonCell } from './nodes';

// Templates
export type {
  TemplatePoiType,
  PoiTemplateLevel,
  PoiTemplate,
  TemplateDetailsFor,
  AnyPoiTemplate,
} from './templates';

// Initial
export type { InitialPoi } from './initial';
