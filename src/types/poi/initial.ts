/**
 * Initial POI данные - для seed/инициализации игры.
 */
import type { InitialCellPoiNode } from './cell';
import type { InitialEncounterPoiNode } from './encounter';
import type { InitialFacilityPoiNode } from './facility';
import type { InitialGenericPoiNode } from './generic';
import type { InitialSpotPoiNode } from './spot';

/**
 * Союз всех initial POI типов.
 */
export type InitialPoi =
  | InitialCellPoiNode
  | InitialEncounterPoiNode
  | InitialFacilityPoiNode
  | InitialSpotPoiNode
  | InitialGenericPoiNode;
