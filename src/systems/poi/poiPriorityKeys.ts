export const POI_OCCUPIED_LABEL = 'occupied';
export const POI_EMPTY_LABEL = 'empty';

export interface PoiPriorityKeyParams {
  npcId?: string | null;
  poiId?: string | null;
}

/**
 * Canonical POI resolver priority shared by image and narrative resolution.
 *
 * occupied (npcId present): {npcId}_{poiId}, {npcId}, occupied_{poiId}, occupied, default
 * empty   (no npcId):       empty_{poiId}, empty, default
 */
export function buildPoiPriorityKeys({ npcId, poiId }: PoiPriorityKeyParams): string[] {
  if (npcId) {
    return [
      poiId && `${npcId}_${poiId}`,
      npcId,
      poiId && `${POI_OCCUPIED_LABEL}_${poiId}`,
      POI_OCCUPIED_LABEL,
      'default',
    ].filter(Boolean) as string[];
  }

  return [poiId && `${POI_EMPTY_LABEL}_${poiId}`, POI_EMPTY_LABEL, 'default'].filter(
    Boolean,
  ) as string[];
}
