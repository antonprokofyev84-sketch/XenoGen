import { POI_TEMPLATES_DB } from '@/data/poi.templates';
import type { Poi, TriggerRule } from '@/types/poi.types';

export const poiManager = {
  computeOnDayPassForPoi: (currentPois: Poi[]): { updatedPois: Poi[]; effects: TriggerRule[] } => {
    const updatedPois: Poi[] = [];
    const effects: TriggerRule[] = [];

    for (const poi of currentPois) {
      const nextPoi =
        typeof poi.duration === 'number' ? { ...poi, duration: poi.duration - 1 } : poi;

      // Check if poi is still active
      if (!(nextPoi.duration === undefined || nextPoi.duration > 0)) continue;

      updatedPois.push(nextPoi);

      const basePoi = POI_TEMPLATES_DB[poi.poiTemplateId];
      if (basePoi?.triggers?.onDayPass) {
        effects.push(...basePoi.triggers.onDayPass);
      }
    }

    return { updatedPois, effects };
  },
};
