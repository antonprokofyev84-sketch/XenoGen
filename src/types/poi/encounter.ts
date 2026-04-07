/**
 * Encounter - боевое столкновение, враги, фракции.
 * Полная информация: runtime details, node, template, initial.
 */
import type { CombatUnit } from '../combat.types';
import type { BasePoiNode, InitialBasePoiNode } from './common';
import type { DiscoverableDetails, InitialOf, OwnableDetails, TemplatedDetails } from './shared';

// ============================================================
// RUNTIME DETAILS
// ============================================================

export interface EncounterDetails extends TemplatedDetails, OwnableDetails, DiscoverableDetails {
  level?: number;
  progress?: number;
  progressMax?: number;

  lifetimeDays?: number | null;

  combatUnits?: CombatUnit[] | null;
  store?: any | null;
}

export interface EncounterPoiNode extends BasePoiNode {
  type: 'encounter';
  details: EncounterDetails;
}

// ============================================================
// INITIAL DETAILS (для seed / initial POI)
// ============================================================

export type InitialEncounterDetails = InitialOf<
  EncounterDetails,
  'isDiscovered' | 'explorationThreshold'
>;

export interface InitialEncounterPoiNode extends InitialBasePoiNode {
  type: 'encounter';
  parentId: string;
  details: InitialEncounterDetails;
}
