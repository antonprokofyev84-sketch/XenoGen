import type { StoreState } from '@/state/useGameState';
import type { BasePoiNode } from '@/types/poi.types';

export function getNestedPoiIds(poiId: string, state: StoreState): string[] {
  const poi = state.poiSlice.pois[poiId];
  if (!poi) return [];
  return poi.nestedPoiIds;
}

export function getLocalSpotIds(poiId: string, state: StoreState): string[] {
  const poi = state.poiSlice.pois[poiId];
  if (!poi) return [];
  return poi.localSpotIds;
}

export function getAllChildPoiIds(poiId: string, state: StoreState): string[] {
  const poi = state.poiSlice.pois[poiId];
  if (!poi) return [];

  return [...poi.nestedPoiIds, ...poi.localSpotIds];
}

export function isLocalSpotPoi(poi: BasePoiNode): boolean {
  return poi.isLocalSpot === true;
}

export function getLocalAreaRootPoiId(poiId: string, state: StoreState): string {
  const poi = state.poiSlice.pois[poiId];
  if (!poi) return poiId;

  if (poi.isLocalSpot === true && poi.parentId) {
    return poi.parentId;
  }

  return poiId;
}

export function getLocalPoiIds(poiId: string, state: StoreState): string[] {
  const localRootId = getLocalAreaRootPoiId(poiId, state);
  const localSpotIds = getLocalSpotIds(localRootId, state);

  return [localRootId, ...localSpotIds];
}

export function getLocalNpcIds(poiId: string, state: StoreState): string[] {
  const localPoiIds = getLocalPoiIds(poiId, state);
  const npcIds: string[] = [];

  for (const localPoiId of localPoiIds) {
    const npcId = state.occupancySlice.poiOccupants[localPoiId];
    if (!npcId) continue;
    npcIds.push(npcId);
  }

  return npcIds;
}

