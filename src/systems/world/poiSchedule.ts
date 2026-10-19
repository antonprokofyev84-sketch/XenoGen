import type { TimeOfDayId } from '@/constants';
import type { NonCellPoiNode } from '@/types/worldNode.types';

/**
 * Открыт ли POI по расписанию в указанный тайм слот.
 *
 * Расписание - runtime копия template; его отсутствие означает, что POI всегда открыт.
 *
 * Это проверка исключительно расписания. `isEntryDisabled`,
 * `entryDisabledDaysLeft` и `PendingRemoval`
 * ограничивают вход игрока и проверяются отдельно.
 */

export function isPoiOpenAt(poi: NonCellPoiNode, timeOfDay: TimeOfDayId): boolean {
  return poi.schedule?.[timeOfDay] !== 'closed';
}
