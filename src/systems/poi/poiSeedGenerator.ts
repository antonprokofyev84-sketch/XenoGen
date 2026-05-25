type GeneratedPoiSeed = { poiType: string };
type GenerationContext = { count: number };

export function generatePoiSeedsForCell(ctx: GenerationContext): GeneratedPoiSeed[] {
  const { count } = ctx;

  const seeds: GeneratedPoiSeed[] = [];
  for (let index = 0; index < count; index++) {
    seeds.push({ poiType: 'scavenger_patrol' });
  }

  return seeds;
}

// export function getRandomEncounterSeed ({cellDetails, chance, action}) => {
//   const threatLevel = Math.floor((cellDetails.threat ?? 0) / 100);
//   const roll = Math.random();
//   if (roll < chance) {
//     const randomOffset = Math.floor(Math.random() * 3) - 1;
//     const poiLevel = Math.max(0, threatLevel + randomOffset);
//     return { poiType: 'random_encounter', level: poiLevel };
//   }
//   return null;
// }
