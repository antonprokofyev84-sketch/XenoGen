export interface PoiPriorityKeyParams {
  npcId?: string | null;
  poiId?: string | null;
  hasOwner?: boolean;
}

/**
 * Canonical POI resolver priority shared by image and narrative resolution.
 *
 * Priority:
 * 1. {npcId}_{poiId}
 * 2. {npcId}
 * 3. defaultOwner_{poiId}
 * 4. defaultOwner
 * 5. {poiId}
 * 6. default
 */
export function buildPoiPriorityKeys(params: PoiPriorityKeyParams): string[] {
  const { npcId, poiId, hasOwner } = params;
  const effectiveHasOwner = hasOwner ?? Boolean(npcId);
  const keys: string[] = [];

  if (npcId && poiId) {
    keys.push(`${npcId}_${poiId}`);
  }

  if (npcId) {
    keys.push(npcId);
  }

  if (effectiveHasOwner && poiId) {
    keys.push(`defaultOwner_${poiId}`);
  }

  if (effectiveHasOwner) {
    keys.push('defaultOwner');
  }

  if (poiId) {
    keys.push(poiId);
  }

  keys.push('default');

  return keys;
}
