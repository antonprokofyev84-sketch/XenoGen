import type { ForceBehavior, InteractionService } from './interaction.types';

// ========================
// Mood
// ========================

export type NarrativeMood = 'hostile' | 'neutral' | 'friendly';

// ========================
// New narrative schema primitives
// ========================

export type NarrativeOutcomeKey = 'success' | 'fail';

export interface DialogueLine {
  speaker: string;
  text: string;
}

export type NarrativeBlock = string | DialogueLine;
export type NarrativeVariant = string | NarrativeBlock[];
export type NarrativeVariants = NarrativeVariant[];

// A narrative key can either point directly to variants or opt into mood-specific variants.
export type NarrativeMoodVariantMap = Partial<Record<NarrativeMood | 'default', NarrativeVariants>>;
export type NarrativeKeyValue = NarrativeVariants | NarrativeMoodVariantMap;

export type NarrativeKeyEntry = Partial<Record<string, NarrativeKeyValue>>;
export type NarrativeOutcomeEntry = Partial<Record<NarrativeOutcomeKey, NarrativeKeyEntry>>;

// ========================
// Narrative context (passed into resolver from outside)
// ========================

export interface NarrativeContext {
  npcId?: string;
  poiId?: string;
  poiTemplateId?: string;
  hasOwner?: boolean;
  tension: number;
}

// ========================
// Narrative action key = any InteractionService + force behaviors + 'enter'
// ========================

export type NarrativeActionKey = InteractionService | ForceBehavior | 'enter';

// ========================
// New POI-template-based narrative map
// ========================

export type PoiTemplateNarrativeActions = Partial<
  Record<NarrativeActionKey, NarrativeOutcomeEntry>
>;
export type PoiTemplateNarrativesMap = Record<string, PoiTemplateNarrativeActions>;
