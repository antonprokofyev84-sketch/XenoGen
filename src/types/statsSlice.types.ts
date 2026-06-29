export interface StatsSliceState {
  combatStats: {
    defeatedByEnemyType: Record<string, number>;
  };
}
