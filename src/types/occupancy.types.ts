export interface OccupancyState {
  npcLocations: Record<string, string | undefined>;
  poiOccupants: Record<string, string | undefined>;
}
