/**
 * Facility - структура в клетке (крепость, базис, поселение и т.д.)
 * Может содержать sub-POI (как spot'ы в таверне).
 */
import type { BasePoiNode, InitialBasePoiNode } from './common';
import type { DiscoverableDetails, InitialOf, OwnableDetails, TemplatedDetails } from './shared';

// ============================================================
// RUNTIME DETAILS
// ============================================================

export interface FacilityDetails extends TemplatedDetails, OwnableDetails, DiscoverableDetails {
  // Facility обычно не имеет специфических полей,
  // но может быть расширена в будущем.
}

export interface FacilityPoiNode extends BasePoiNode {
  type: 'facility';
  details: FacilityDetails;
}

// ============================================================
// INITIAL DETAILS
// ============================================================

export type InitialFacilityDetails = InitialOf<
  FacilityDetails,
  'isDiscovered' | 'explorationThreshold'
>;

export interface InitialFacilityPoiNode extends InitialBasePoiNode {
  type: 'facility';
  parentId: string;
  details: InitialFacilityDetails;
}
