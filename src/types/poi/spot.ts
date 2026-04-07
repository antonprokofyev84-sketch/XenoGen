/**
 * Spot - мини-POI внутри facility.
 * Например: bartender spot в таверне, waitress spot, free table.
 * Ключевое поле: requiresOwner - если true, spot недоступен без NPC владельца.
 */
import type { BasePoiNode, InitialBasePoiNode } from './common';
import type { DiscoverableDetails, InitialOf, TemplatedDetails } from './shared';

// ============================================================
// RUNTIME DETAILS
// ============================================================

export interface SpotDetails extends TemplatedDetails, DiscoverableDetails {
  ownerId?: string;

  /**
   * Если true: spot не показывается в навигации и не доступен,
   * пока не назначен NPC как владелец (ownerId).
   */
  requiresOwner: boolean;
}

export interface SpotPoiNode extends BasePoiNode {
  type: 'spot';
  details: SpotDetails;
}

// ============================================================
// INITIAL DETAILS
// ============================================================

export type InitialSpotDetails = InitialOf<
  SpotDetails,
  'requiresOwner' | 'isDiscovered' | 'explorationThreshold'
>;

export interface InitialSpotPoiNode extends InitialBasePoiNode {
  type: 'spot';
  parentId: string;
  details: InitialSpotDetails;
}
