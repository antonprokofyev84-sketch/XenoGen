import type { StoreState } from '@/state/useGameState';
import { isPoiOpenAt } from '@/systems/world/poiSchedule';
import type { PoiId } from '@/types/ids.types';
import { isNonCellNode } from '@/types/worldNode.types';
import { resolveTimeOfDay } from '@/utils/timeOfDay';

/**
 * Единственное правило доступа ко входу в POI.
 *
 * Его читают и навигация, и мировое перемещение, поэтому авторский переход
 * не может обойти ограничение, которое UI показывает как недоступное.
 *
 * `isDiscovered`, `schedule`, `isEntryDisabled`, `entryDisabledDaysLeft` и
 * `pendingRemoval` работают независимо друг от друга.
 */

/** Причина, по которой переход показывается, но недоступен. */
export type PoiEntryBlockReason = 'closed' | 'entryDisabled' | 'entryRefused';

export const POI_ENTRY_BLOCK_LABELS: Readonly<Record<PoiEntryBlockReason, string>> = {
  closed: 'Закрыто',
  entryDisabled: 'Вход недоступен',
  entryRefused: 'Вас сюда не пускают',
};

export function resolvePoiEntryBlock(
  state: StoreState,
  poiId: PoiId,
): PoiEntryBlockReason | undefined {
  const poi = state.poiSlice.pois[poiId];
  if (!poi || !isNonCellNode(poi)) return undefined;

  if (!isPoiOpenAt(poi, resolveTimeOfDay(state.world.currentTime))) return 'closed';
  if (poi.details.isEntryDisabled) return 'entryDisabled';
  if ((poi.details.entryDisabledDaysLeft ?? 0) > 0) return 'entryRefused';

  return undefined;
}

/**
 * Можно ли войти в POI извне.
 *
 * Помимо показываемых причин сюда входят случаи, которые навигация вообще не
 * предлагает: необнаруженный и помеченный на удаление POI.
 */
export function canEnterPoi(state: StoreState, poiId: PoiId): boolean {
  const poi = state.poiSlice.pois[poiId];
  if (!poi || !isNonCellNode(poi)) return true;

  if (poi.pendingRemoval || !poi.details.isDiscovered) return false;

  return resolvePoiEntryBlock(state, poiId) === undefined;
}
