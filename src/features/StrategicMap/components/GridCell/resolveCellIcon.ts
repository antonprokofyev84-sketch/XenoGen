import type { NonCellPoiNode } from '@/types/worldNode.types';

const POI_ICON_PRIORITY: Record<string, number> = {
  boss: 100,
  quest: 90,
  settlement: 80,
  base: 70,
};

export function resolveCellIcon(pois: NonCellPoiNode[]) {
  let best: { icon: string; faction?: string } | null = null;
  let bestPriority = -1;

  for (const poi of pois) {
    const priority = POI_ICON_PRIORITY[poi.templateId];
    if (!priority) continue;

    if (priority > bestPriority) {
      bestPriority = priority;
      best = { icon: poi.templateId, faction: poi.details.faction ?? 'neutral' };
    }
  }

  return best;
}
