import { POI_NARRATIVES } from '@/data/narrative/poiNarratives';
import type { StoreState } from '@/state/useGameState';
import { buildPoiPriorityKeys } from '@/systems/poi/poiPriorityKeys';
import type { InteractionLogEvent } from '@/types/interaction.types';
import type {
  NarrativeBlock,
  NarrativeKeyValue,
  NarrativeMood,
  NarrativeVariant,
  NarrativeVariants,
  PoiTemplateNarrativeActions,
} from '@/types/narrative.types';

import { getMoodFromTension } from './narrativeMood';

// ========================
// Generic fallback
// ========================

/**
 * Final safety-net text when no narrative entry exists for the requested
 * action/outcome pair.
 */
function genericFallback(action: string, success?: boolean): string {
  if (success === undefined) return action;
  return success ? `${action}: success` : `${action}: fail`;
}

/**
 * Resolver output is always block-based, so even the cheapest fallback is
 * wrapped into a one-block narrative.
 */
function genericBlockFallback(action: string, success?: boolean): NarrativeBlock[] {
  return [genericFallback(action, success)];
}

/**
 * Picks one random variant from the outer variants array.
 *
 * The outer array represents alternative random outcomes; the chosen item is
 * then normalized into ordered narrative blocks.
 */
function pickRandomVariant(variants?: NarrativeVariants): NarrativeVariant | undefined {
  if (!variants || variants.length === 0) return undefined;
  if (variants.length === 1) return variants[0];
  return variants[Math.floor(Math.random() * variants.length)];
}

/**
 * Normalizes any resolved variant into NarrativeBlock[].
 *
 * Simple string variants become a one-item array, while composite variants are
 * already stored as ordered blocks and can pass through unchanged.
 */
function normalizeNarrativeVariant(variant?: NarrativeVariant): NarrativeBlock[] | undefined {
  if (!variant) return undefined;
  return typeof variant === 'string' ? [variant] : variant;
}

/**
 * Resolves the variant list stored under one narrative key.
 *
 * Keys can use either the simple format (`NarrativeVariants`) or the optional
 * mood-aware format. When a mood map is used, resolver falls back to `default`.
 */
function resolveTemplateMoodVariants(
  entry: NarrativeKeyValue | undefined,
  requestedMood: NarrativeMood,
): NarrativeVariants | undefined {
  if (!entry) return undefined;

  if (Array.isArray(entry)) {
    return entry;
  }

  return entry[requestedMood] ?? entry.default;
}

/**
 * Resolves one POI template action/outcome pair into ordered narrative blocks.
 *
 * The function walks the shared POI priority chain (`npcId_poiId` → `default`),
 * picks the first matching narrative key, then resolves mood and random variant
 * inside that key.
 */
function resolveTemplateNarrativeBlocks(
  poiActions: PoiTemplateNarrativeActions,
  action: string,
  outcomeKey: 'success' | 'fail',
  priorityKeys: string[],
  mood: NarrativeMood,
): NarrativeBlock[] | undefined {
  const actionEntry = poiActions[action as keyof PoiTemplateNarrativeActions];
  if (!actionEntry) return undefined;

  const outcomeEntry = actionEntry[outcomeKey];
  if (!outcomeEntry) return undefined;

  for (const key of priorityKeys) {
    const variant = pickRandomVariant(resolveTemplateMoodVariants(outcomeEntry[key], mood));
    const blocks = normalizeNarrativeVariant(variant);
    if (blocks) return blocks;
  }

  return undefined;
}

function shouldUseGenericFallback(action: string): boolean {
  return !['intro', 'return_local', 'return_nested'].includes(action);
}

function resolveMissingNarrative(action: string, success?: boolean): NarrativeBlock[] {
  if (!shouldUseGenericFallback(action)) {
    return [];
  }

  return genericBlockFallback(action, success);
}

function getNarrativePriorityKeys(state: StoreState, narrativePoiId: string): string[] {
  const npcId = state.occupancySlice.poiOccupants[narrativePoiId];
  return buildPoiPriorityKeys({
    npcId: npcId ?? null,
    poiId: narrativePoiId,
  });
}

/**
 * Public narrative resolver used by the interaction log.
 *
 * It resolves POI_NARRATIVES by `poiType`, action, outcome, narrative key,
 * optional mood, and random variant selection. Missing content falls back to a
 * minimal action/outcome string so the UI remains readable during authoring.
 */
export function resolveNarrativeBlocks(
  state: StoreState,
  logEvent: InteractionLogEvent,
): NarrativeBlock[] {
  const { action, success, tension } = logEvent;
  const mood = getMoodFromTension(tension);

  // IMPORTANT:
  // success === undefined → treat as success (enter, passive events)
  const outcomeKey: 'success' | 'fail' = success === false ? 'fail' : 'success';
  const narrativePoiId = logEvent.narrativePoiId;

  if (!narrativePoiId) {
    return resolveMissingNarrative(action, success);
  }

  const narrativePoi = state.poiSlice.pois[narrativePoiId];
  if (!narrativePoi || narrativePoi.type === 'cell') {
    return resolveMissingNarrative(action, success);
  }

  const templateActions = POI_NARRATIVES[narrativePoi.type];
  if (!templateActions) {
    return resolveMissingNarrative(action, success);
  }

  const priorityKeys = getNarrativePriorityKeys(state, narrativePoiId);

  const blocks = resolveTemplateNarrativeBlocks(
    templateActions,
    action,
    outcomeKey,
    priorityKeys,
    mood,
  );
  if (blocks) return blocks;

  return resolveMissingNarrative(action, success);
}
