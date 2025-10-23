import type { CombatStats, CombatUnit } from '@/types/combat.types';
import type { WeaponSlots } from '@/types/equipment.types';
import { clamp } from '@/utils/utils';

export interface AttackRollResult {
  type: 'hit' | 'miss' | 'crit';
  damage: number;
  weaponType: WeaponSlots;
}

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

export const calculateAttackResult = (
  attacker: CombatUnit,
  target: CombatUnit,
): AttackRollResult[] => {
  const activeSlot = attacker.activeWeaponSlot;
  const weaponInstance = attacker.equipment[activeSlot];

  if (!weaponInstance) {
    console.error(
      `[combatCalculator] Attacker ${attacker.instanceId} has no active weapon in slot ${activeSlot}`,
    );
    return [];
  }

  const attackerStatsWithMods = applyTemporaryMods(attacker.stats, weaponInstance.mods);

  let hitChance: number;
  if (activeSlot === 'meleeWeapon') {
    hitChance = attackerStatsWithMods.melee - target.stats.evasion;
  } else {
    // activeSlot === 'rangeWeapon'
    hitChance = attackerStatsWithMods.range - Math.floor(target.stats.evasion / 2);
  }
  hitChance = clamp(hitChance, 5, 95);

  const results: AttackRollResult[] = [];
  const attacksPerTurn = weaponInstance.attacksPerTurn ?? 1;

  for (let i = 0; i < attacksPerTurn; i++) {
    const hitRoll = Math.random() * 100;
    const didHit = hitRoll <= hitChance;

    if (!didHit) {
      console.log(
        `[combatCalculator] Attack ${i + 1}/${attacksPerTurn}: ${attacker.instanceId} missed ${target.instanceId} (Roll: ${hitRoll.toFixed(1)} vs Chance: ${hitChance})`,
      );
      results.push({ type: 'miss', damage: 0, weaponType: activeSlot });
      continue;
    }

    const critChance = attackerStatsWithMods.critChance;
    const critRoll = Math.random() * 100;
    const didCrit = critRoll <= critChance;

    if (didCrit) {
      console.log(
        `[combatCalculator] Attack ${i + 1}/${attacksPerTurn}: ${attacker.instanceId} CRITICAL HIT on ${target.instanceId}!`,
      );
    }

    let baseDamage =
      Math.floor(Math.random() * (weaponInstance.damage[1] - weaponInstance.damage[0] + 1)) +
      weaponInstance.damage[0];
    let armorPiercing = weaponInstance.armorPiercing ?? 0;

    if (activeSlot === 'meleeWeapon') {
      baseDamage += attackerStatsWithMods.baseMeleeDamage;
    }

    if (didCrit) {
      baseDamage = Math.floor(baseDamage * 1.5);
      armorPiercing = Math.floor(armorPiercing * 1.5);
    }

    const targetArmor = target.stats.armor;
    const effectiveArmor = Math.max(0, targetArmor - armorPiercing);
    const damageDealtThisAttack = Math.max(0, baseDamage - effectiveArmor);

    console.log(
      `[combatCalculator] Attack ${i + 1}/${attacksPerTurn}: ${attacker.instanceId} hit ${target.instanceId} for ${damageDealtThisAttack} damage (Crit: ${didCrit}, Roll: ${hitRoll.toFixed(1)} vs Chance: ${hitChance})`,
    );

    results.push({
      type: didCrit ? 'crit' : 'hit',
      damage: damageDealtThisAttack,
      weaponType: activeSlot,
    });
  }

  return results;
};
