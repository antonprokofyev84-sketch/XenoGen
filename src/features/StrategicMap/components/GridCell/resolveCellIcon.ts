import type { NonCellNode, PoiType } from '@/types/poi.types';

const POI_ICON_PRIORITY: Partial<Record<PoiType, number>> = {
  boss: 100,
  quest: 90,
  settlement: 80,
  base: 70,
};

export function resolveCellIcon(pois: NonCellNode[]) {
  let best: { icon: string; faction?: string } | null = null;
  let bestPriority = -1;

  for (const poi of pois) {
    const priority = POI_ICON_PRIORITY[poi.type];
    if (!priority) continue;

    if (priority > bestPriority) {
      bestPriority = priority;
      best = { icon: poi.type, faction: poi.details?.faction };
    }
  }

  return best;
}
