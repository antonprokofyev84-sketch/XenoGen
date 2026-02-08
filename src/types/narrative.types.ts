import type { ForceBehavior, InteractionService } from './interaction.types';
import type { PoiType } from './poi.types';

// ========================
// Mood
// ========================

export type NarrativeMood = 'hostile' | 'neutral' | 'friendly';

// ========================
// Narrative context (passed into resolver from outside)
// ========================

export interface NarrativeContext {
  npcId?: string;
  poiType?: PoiType;
  factionId?: string;
  tension: number;
}

// ========================
// Outcome bucket (success / fail texts)
// ========================

export interface NpcOutcomeBucket {
  generalText?: string[];
  poiTypeOverrides?: Record<string, string[]>;
}

export interface PoiOutcomeBucket {
  generalText?: string[];
  factionOverrides?: Record<string, string[]>;
}

// ========================
// Mood bucket for service actions (has success/fail)
// ========================

export interface NpcServiceMoodBucket {
  success?: NpcOutcomeBucket;
  fail?: NpcOutcomeBucket;
}

export interface PoiServiceMoodBucket {
  success?: PoiOutcomeBucket;
  fail?: PoiOutcomeBucket;
}

// ========================
// Action entries
// ========================
/**
 * If a mood bucket is missing, resolver may fallback to 'neutral'
 */

export type NpcServiceActionEntry = Partial<Record<NarrativeMood, NpcServiceMoodBucket>>;
export type PoiServiceActionEntry = Partial<Record<NarrativeMood, PoiServiceMoodBucket>>;

// ========================
// Narrative action key = any InteractionService + force behaviors + 'enter'
// ========================

export type NarrativeActionKey = InteractionService | ForceBehavior | 'enter';

// ========================
// Per-NPC narrative record
// ========================

export type NpcNarrativeActions = Partial<Record<NarrativeActionKey, NpcServiceActionEntry>>;

// ========================
// Per-PoiType narrative record
// ========================

export type PoiNarrativeActions = Partial<Record<NarrativeActionKey, PoiServiceActionEntry>>;

// ========================
// Top-level maps
// ========================

export type NpcNarrativesMap = Record<string, NpcNarrativeActions>;
export type PoiNarrativesMap = Partial<Record<PoiType, PoiNarrativeActions>>;
