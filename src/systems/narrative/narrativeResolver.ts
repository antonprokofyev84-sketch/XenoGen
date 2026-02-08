import { npcNarratives } from '@/data/narrative/npcNarratives';
import { poiNarratives } from '@/data/narrative/poiNarratives';
import type { InteractionLogEvent } from '@/types/interaction.types';
import type {
  NarrativeContext,
  NarrativeMood,
  NpcNarrativeActions,
  NpcServiceMoodBucket,
  PoiNarrativeActions,
  PoiServiceMoodBucket,
} from '@/types/narrative.types';

import { getMoodFromTension } from './narrativeMood';

// ========================
// Generic fallback
// ========================

function genericFallback(action: string, success?: boolean): string {
  if (success === undefined) return action;
  return success ? `${action}: success` : `${action}: fail`;
}

// ========================
// Safe random pick
// ========================

function pickRandom(variants?: readonly string[]): string | undefined {
  if (!variants || variants.length === 0) return undefined;
  return variants[Math.floor(Math.random() * variants.length)];
}

// ========================
// Mood fallback: requested → neutral
// ========================

function resolveMoodBucket<T>(
  moodMap: Partial<Record<NarrativeMood, T>> | undefined,
  requestedMood: NarrativeMood,
): T | undefined {
  if (!moodMap) return undefined;

  const direct = moodMap[requestedMood];
  if (direct) return direct;

  if (requestedMood !== 'neutral') {
    return moodMap.neutral;
  }

  return undefined;
}

// ========================
// NPC narrative resolution
// ========================

function resolveNpcText(
  npcActions: NpcNarrativeActions,
  action: string,
  mood: NarrativeMood,
  outcomeKey: 'success' | 'fail',
  poiType?: string,
): string | undefined {
  const actionEntry = npcActions[action as keyof NpcNarrativeActions];
  if (!actionEntry) return undefined;

  const moodBucket = resolveMoodBucket<NpcServiceMoodBucket>(actionEntry, mood);
  if (!moodBucket) return undefined;

  const outcomeBucket = moodBucket[outcomeKey];
  if (!outcomeBucket) return undefined;

  // POI-type override
  if (poiType) {
    const override = pickRandom(outcomeBucket.poiTypeOverrides?.[poiType]);
    if (override) return override;
  }

  return pickRandom(outcomeBucket.generalText);
}

// ========================
// POI narrative resolution
// ========================

function resolvePoiText(
  poiActions: PoiNarrativeActions,
  action: string,
  mood: NarrativeMood,
  outcomeKey: 'success' | 'fail',
  factionId?: string,
): string | undefined {
  const actionEntry = poiActions[action as keyof PoiNarrativeActions];
  if (!actionEntry) return undefined;

  const moodBucket = resolveMoodBucket<PoiServiceMoodBucket>(actionEntry, mood);
  if (!moodBucket) return undefined;

  const outcomeBucket = moodBucket[outcomeKey];
  if (!outcomeBucket) return undefined;

  // Faction override
  if (factionId) {
    const override = pickRandom(outcomeBucket.factionOverrides?.[factionId]);
    if (override) return override;
  }

  return pickRandom(outcomeBucket.generalText);
}

// ========================
// Public API
// ========================

/**
 * Resolves a single InteractionLogEvent into a narrative string.
 *
 * Priority:
 *   NPC → POI-type → generic fallback
 *
 * Pure function:
 *   - no store reads
 *   - no mutations
 *   - deterministic except random text choice
 */
export function resolveNarrativeText(
  logEvent: InteractionLogEvent,
  context: NarrativeContext,
): string {
  const { npcId, poiType, factionId } = context;
  const { action, success, tension } = logEvent;

  const mood = getMoodFromTension(tension);

  // IMPORTANT:
  // success === undefined → treat as success (enter, passive events)
  const outcomeKey: 'success' | 'fail' = success === false ? 'fail' : 'success';

  // 1) NPC-specific narrative
  if (npcId) {
    const npcActions = npcNarratives[npcId];
    if (npcActions) {
      const text = resolveNpcText(npcActions, action, mood, outcomeKey, poiType);
      if (text) return text;
    }
  }

  // 2) POI-type narrative
  if (poiType) {
    const poiActions = poiNarratives[poiType];
    if (poiActions) {
      const text = resolvePoiText(poiActions, action, mood, outcomeKey, factionId);
      if (text) return text;
    }
  }

  // 3) Generic fallback
  return genericFallback(action, success);
}
