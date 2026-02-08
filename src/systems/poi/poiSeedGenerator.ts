import type { CellDetails } from '@/types/poi.types';

type GeneratedPoiSeed = { poiTemplateId: string; level?: number };
type GenerationContext = { cellDetails: CellDetails; count: number };

export function generatePoiSeedsForCell(ctx: GenerationContext): GeneratedPoiSeed[] {
  const { cellDetails, count } = ctx;

  const threatLevel = Math.floor((cellDetails.threat ?? 0) / 100);

  const seeds: GeneratedPoiSeed[] = [];
  for (let index = 0; index < count; index++) {
    // диапазон: threatLevel-1 .. threatLevel+1
    const randomOffset = Math.floor(Math.random() * 3) - 1;
    const poiLevel = Math.max(0, threatLevel + randomOffset);

    seeds.push({ poiTemplateId: 'scavenger_patrol', level: poiLevel });
  }

  return seeds;
}

// export function getRandomEncounterSeed ({cellDetails, chance, action}) => {
//   const threatLevel = Math.floor((cellDetails.threat ?? 0) / 100);
//   const roll = Math.random();
//   if (roll < chance) {
//     const randomOffset = Math.floor(Math.random() * 3) - 1;
//     const poiLevel = Math.max(0, threatLevel + randomOffset);
//     return { poiTemplateId: 'random_encounter', level: poiLevel };
//   }
//   return null;
// }
