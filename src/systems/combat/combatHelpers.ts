import type { CombatStats, CombatUnit } from '@/types/combat.types';
import type { WeaponSlots } from '@/types/equipment.types';
import type { WeaponType } from '@/types/weapon.types';
import { clamp } from '@/utils/utils';

import { getBaseTurnTime } from './combatInitiativeHelpers';

const BASE_DELAY_PER_POSITION = 3;

export interface AttackRollResult {
  attackerId: string;
  type: 'hit' | 'miss' | 'crit';
  damage: number;
  lethality: number;
  weaponType: WeaponType;
}

// === Shared helpers ===
export const computeHitChancePercent = (
  attackerStats: CombatStats,
  targetStats: CombatStats,
  slot: WeaponSlots,
): number => {
  let hitChancePercent: number;
  if (slot === 'meleePrimary' || slot === 'meleeSecondary') {
    hitChancePercent = attackerStats.melee - targetStats.evasion;
  } else {
    hitChancePercent = attackerStats.range - Math.floor(targetStats.evasion / 2);
  }
  return clamp(hitChancePercent, 5, 95);
};

export const getDelayPoints = (
  attacker: CombatUnit,
  target: CombatUnit,
  occupiedPositions: number[] = [],
): number => {
  const distanceBetweenUnits = Math.abs(attacker.position - target.position);
  const deltaDistance =
    distanceBetweenUnits - attacker.equipment[attacker.activeWeaponSlot]!.distance;

  if (deltaDistance <= 0) {
    return 0;
  }

  let delayPoints = 0;
  for (let i = 1; i <= deltaDistance; i++) {
    if (attacker.faction === 'player') {
      delayPoints += BASE_DELAY_PER_POSITION + occupiedPositions[attacker.position + i];
    } else {
      delayPoints += BASE_DELAY_PER_POSITION + occupiedPositions[attacker.position - i];
    }
  }

  return delayPoints;
};

export const computeEffectiveArmor = (targetArmor: number, armorPiercing?: number): number => {
  const armorPiercingSafe = armorPiercing ?? 0;
  return Math.max(0, targetArmor - armorPiercingSafe);
};

const applyTemporaryMods = (baseStats: CombatStats, mods?: Partial<CombatStats>): CombatStats => {
  const modifiedStats = { ...baseStats };
  if (!mods) return modifiedStats;

  (Object.keys(mods) as (keyof Partial<CombatStats>)[]).forEach((key) => {
    if (key in modifiedStats && mods[key] !== undefined) {
      modifiedStats[key as keyof CombatStats] += mods[key] as number;
    }
  });
  return modifiedStats;
};

// === Deterministic forecast (no rolls) ===
export interface AttackForecast {
  // параметры оружия
  minDamage: number;
  maxDamage: number;
  armorPiercing: number;
  attackPerTurn: number;
  weaponType: WeaponType;
  lethality: number;
  // шансы
  hitChancePercent: number;
  critChancePercent: number;
  // прочее
  targetDefense: number;
  delayPoints: number;
  relativeDelay: number;
  canKill: boolean;
  averageDamage: number;
  effectiveDamage: number;
  targetId: string;
  attackerId: string;
}

export const calculateAttackForecast = (
  attacker: CombatUnit,
  target: CombatUnit,
  occupiedPositions: number[],
): AttackForecast | null => {
  const activeSlot = attacker.activeWeaponSlot;
  const weaponInstance = attacker.equipment[activeSlot];

  if (attacker.instanceId === target.instanceId) {
    return null;
  }

  if (attacker.faction === target.faction) {
    return null;
  }

  // Melee attack from backline is not possible
  if (
    (activeSlot === 'meleePrimary' || activeSlot === 'meleeSecondary') &&
    (attacker.position === 0 || attacker.position === 3)
  ) {
    return null;
  }

  if (!weaponInstance) {
    console.error(
      `[combatCalculator] Attacker ${attacker.instanceId} has no active weapon in slot ${activeSlot}`,
    );
    return null;
  }

  const attackerStatsWithMods = applyTemporaryMods(attacker.stats, weaponInstance.mods);

  const hitChancePercent = computeHitChancePercent(attackerStatsWithMods, target.stats, activeSlot);

  // inline damage range after armor (no crit)
  const meleeBonus =
    activeSlot === 'meleePrimary' || activeSlot === 'meleeSecondary'
      ? attackerStatsWithMods.baseMeleeDamage
      : 0;
  const baseMinBeforeArmor = weaponInstance.damage[0] + meleeBonus;
  const baseMaxBeforeArmor = weaponInstance.damage[1] + meleeBonus;

  const effectiveArmor = computeEffectiveArmor(target.stats.armor, weaponInstance.armorPiercing);
  const minDamage = Math.max(0, baseMinBeforeArmor - effectiveArmor);
  const maxDamage = Math.max(0, baseMaxBeforeArmor - effectiveArmor);

  const averageDamageAfterArmor = ((minDamage + maxDamage) * weaponInstance.attacksPerTurn) / 2;

  // delays
  const delayPoints = getDelayPoints(attacker, target, occupiedPositions);
  const relativeDelay =
    (delayPoints / Math.max(1, attacker.stats.initiative)) *
    getBaseTurnTime(attacker.stats.initiative);

  // kill flag
  const canKill = target.stats.hp <= maxDamage;

  // effective damage
  const effectiveDamage = (averageDamageAfterArmor * hitChancePercent) / 100 / (1 + relativeDelay);

  return {
    minDamage: baseMinBeforeArmor,
    maxDamage: baseMaxBeforeArmor,
    attackPerTurn: weaponInstance.attacksPerTurn,
    armorPiercing: weaponInstance.armorPiercing,
    lethality: weaponInstance.lethality,
    weaponType: weaponInstance.type,
    hitChancePercent,
    critChancePercent: attackerStatsWithMods.critChance,
    targetDefense: target.stats.armor,
    delayPoints,
    relativeDelay,
    canKill,
    averageDamage: averageDamageAfterArmor,
    effectiveDamage,
    targetId: target.instanceId,
    attackerId: attacker.instanceId,
  };
};

export const calculateAttackResult = (forecast: AttackForecast): AttackRollResult[] => {
  const results: AttackRollResult[] = [];
  const attacks = Math.max(1, forecast.attackPerTurn ?? 1);

  for (let i = 0; i < attacks; i++) {
    const didHit = Math.random() * 100 <= forecast.hitChancePercent;
    if (!didHit) {
      results.push({
        attackerId: forecast.attackerId,
        type: 'miss',
        damage: 0,
        lethality: 0,
        weaponType: forecast.weaponType,
      });
      continue;
    }

    let base =
      Math.floor(Math.random() * (forecast.maxDamage - forecast.minDamage + 1)) +
      forecast.minDamage;

    let armorPiercing = forecast.armorPiercing ?? 0;
    const didCrit = Math.random() * 100 <= forecast.critChancePercent;
    if (didCrit) {
      base = Math.floor(base * 1.5);
      armorPiercing = Math.floor(armorPiercing * 1.5);
    }

    const effectiveArmor = Math.max(0, forecast.targetDefense - armorPiercing);
    const damageAfterArmor = Math.max(0, Math.floor(base - effectiveArmor));

    results.push({
      attackerId: forecast.attackerId,
      type: didCrit ? 'crit' : 'hit',
      damage: damageAfterArmor,
      lethality: forecast.lethality,
      weaponType: forecast.weaponType,
    });
  }

  return results;
};

const KILL_WEIGHT_BONUS = 2;
const MAX_WEIGHT_BONUS = 2;

export const chooseTargetForecast = (forecasts: AttackForecast[]): AttackForecast | null => {
  if (forecasts.length === 0) return null;
  if (forecasts.length === 1) return forecasts[0];

  let weights = forecasts.map((f) => ({
    targetId: f.targetId,
    weight: f.canKill ? f.effectiveDamage * KILL_WEIGHT_BONUS : f.effectiveDamage,
    canKill: f.canKill,
  }));

  const maxWeight = Math.max(...weights.map((w) => w.weight));
  weights = weights.map((w) =>
    w.weight === maxWeight ? { ...w, weight: w.weight * MAX_WEIGHT_BONUS } : w,
  );

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  if (totalWeight <= 0) {
    return forecasts[Math.floor(Math.random() * forecasts.length)];
  }

  let roll = Math.random() * totalWeight;
  for (const w of weights) {
    if (roll < w.weight) {
      const f = forecasts.find((fc) => fc.targetId === w.targetId)!;
      return f;
    }
    roll -= w.weight;
  }

  return null;
};
