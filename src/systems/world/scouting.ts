type ScoutLevelParams = {
  maxRollValue: number;
  bonus: number;
};

export function resolveScoutExplorationLevel({ maxRollValue, bonus }: ScoutLevelParams): number {
  // возможно нужно взять минимальное значение восприятия в партии как минимум.
  const cappedMaxRoll = Math.max(0, Math.floor(maxRollValue));
  const cappedBonus = Math.max(0, Math.floor(bonus));
  const roll = Math.floor(Math.random() * (cappedMaxRoll + 1));

  return roll + cappedBonus;
}
