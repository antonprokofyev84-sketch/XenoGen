import type { StoreState } from '@/state/useGameState';
import type { PoiId } from '@/types/ids.types';

/**
 * Обход дерева мира через store.
 *
 * Дерево строится только на `childPoiIds`: отдельных списков вложенных POI и
 * локальных точек больше нет.
 */

export function getChildPoiIds(poiId: string, state: StoreState): readonly PoiId[] {
  return state.poiSlice.pois[poiId]?.childPoiIds ?? [];
}

/** POI и его непосредственные дети: область, в которой ищутся локальные NPC. */
export function getLocalPoiIds(poiId: string, state: StoreState): string[] {
  return [poiId, ...getChildPoiIds(poiId, state)];
}

export function getLocalNpcIds(poiId: string, state: StoreState): string[] {
  const npcIds: string[] = [];

  for (const localPoiId of getLocalPoiIds(poiId, state)) {
    const occupants = state.occupancySlice.slotOccupants[localPoiId];
    if (!occupants) continue;

    for (const npcId of Object.values(occupants)) {
      if (npcId === undefined) continue;

      npcIds.push(npcId);
    }
  }

  return npcIds;
}
