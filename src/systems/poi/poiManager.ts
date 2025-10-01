import { GRID_COLS, GRID_ROWS } from '@/constants';
import { POI_TEMPLATES_DB } from '@/data/poi.templates';
import type { ActivePoi, EffectsMap, PoiType } from '@/types/poi.types';

export const poiManager = {
  getPoiInstance: (poiTemplateId: string): ActivePoi | null => {
    const template = POI_TEMPLATES_DB[poiTemplateId];
    // let it fail loudly for now
    // if (!template) {
    //   return null;
    // }
    const newPoiInstance: ActivePoi = {
      id: '',
      poiTemplateId: poiTemplateId,

      type: template.type as PoiType,
      faction: template.faction as string,
      perceptionThreshold: template.perceptionThreshold as number,

      rarity: template.rarity,
      difficulty: template.difficulty,
      duration: template.duration,
      progress: template.progress ?? 0,
      progressMax: template.progressMax,

      // isDiscovered: false,
      isDiscovered: true,
    };

    return newPoiInstance;
  },
  computeOnDayPassForPoi: (
    currentPois: ActivePoi[],
  ): { updatedPois: ActivePoi[]; effects?: EffectsMap } => {
    const updatedPois: ActivePoi[] = [];
    let effects: EffectsMap | undefined;

    for (const poi of currentPois) {
      const nextPoi =
        typeof poi.duration === 'number' ? { ...poi, duration: poi.duration - 1 } : poi;

      // Check if poi is still active
      if (!(nextPoi.duration === undefined || nextPoi.duration > 0)) continue;

      updatedPois.push(nextPoi);

      const basePoi = POI_TEMPLATES_DB[poi.poiTemplateId];

      const onDayPass = basePoi?.triggers?.onDayPass;
      if (onDayPass) {
        (effects ??= {})[poi.id] = onDayPass;
      }
    }

    return { updatedPois, effects };
  },
  getCellIdsInRadius({
    radius,
    center,
    mode = 'ring',
  }: {
    radius: number;
    center: string;
    mode?: 'disk' | 'ring';
  }): string[] {
    if (radius <= 0) {
      throw new Error('Radius must be positive');
    }
    const [cx, cy] = center.split('-').map(Number);

    const rmin2 = mode === 'ring' ? (radius - 0.5) * (radius - 0.5) : 0;
    const rmax2 = (radius + 0.5) * (radius + 0.5);
    const R = radius;

    const out: string[] = [];
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 >= rmin2 && d2 <= rmax2) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) continue;

          out.push(`${x}-${y}`);
        }
      }
    }
    return out;
  },
};
