import type { AttackStatistic, CharacterCombatMetrics } from '@/types/combat.types';

import type { AttackRollResult } from './combatHelpers';

export const blankAttackStat = (): AttackStatistic => ({
  attacksMade: 0,
  hits: 0,
  misses: 0,
  crits: 0,
  totalDamageDealt: 0,
});

export const blankMetric = (): CharacterCombatMetrics => ({
  melee: blankAttackStat(),
  range: blankAttackStat(),
  kills: 0,
  damageTaken: 0,
  hitsReceived: 0,
  hitsEvaded: 0,
  critsReceived: 0,
});

// this functions are used inside immer set so we mutate the metrics object directly

export const addOffenseMetrics = (
  metrics: CharacterCombatMetrics,
  resultsArray: AttackRollResult[],
): CharacterCombatMetrics => {
  if (resultsArray.length === 0) return metrics;

  for (const res of resultsArray) {
    const stat = res.weaponType === 'meleeWeapon' ? metrics.melee : metrics.range;

    stat.attacksMade += 1;
    if (res.type === 'miss') stat.misses += 1;
    if (res.type === 'hit') stat.hits += 1;
    if (res.type === 'crit') {
      stat.crits += 1;
      stat.hits += 1;
    }
    stat.totalDamageDealt += res.damage;
  }

  return metrics;
};

export const addDefenseMetrics = (
  metrics: CharacterCombatMetrics,
  resultsArray: AttackRollResult[],
): CharacterCombatMetrics => {
  for (const res of resultsArray) {
    metrics.damageTaken += res.damage;
    if (res.type === 'hit' || res.type === 'crit') {
      metrics.hitsReceived += 1;
    }
    if (res.type === 'crit') {
      metrics.critsReceived += 1;
    }
  }

  return metrics;
};
