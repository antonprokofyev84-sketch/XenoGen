import { calculateMaxHp } from '@/state/gameSlices/characters';
import type { StoreState } from '@/state/useGameState';
import { traitsRegistry } from '@/systems/traits/traitsRegistry';
import type { Character } from '@/types/character.types';
import type { CharacterCombatMetrics, CombatStatus } from '@/types/combat.types';
import type { EffectLog } from '@/types/logs.types';

export function updateBattleStatistics(
  character: Character,
  combatStatus: CombatStatus,
  metrics: CharacterCombatMetrics,
) {
  // --- 1) Гарантируем статистику ---
  if (!character.statistics) {
    character.statistics = {
      battlesWon: 0,
      battlesLost: 0,
      battlesRetreated: 0,
      enemiesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
    };
  }

  const stat = character.statistics;

  if (combatStatus === 'victory') stat.battlesWon += 1;
  else if (combatStatus === 'defeat') stat.battlesLost += 1;
  else if (combatStatus === 'retreat') stat.battlesRetreated += 1;

  // --- 2) Метрики урона / киллов ---
  const kills = metrics.kills ?? 0;
  const dealt = (metrics.melee?.totalDamageDealt ?? 0) + (metrics.range?.totalDamageDealt ?? 0);
  const taken = metrics.damageTaken ?? 0;

  stat.enemiesKilled += kills;
  stat.damageDealt += dealt;
  stat.damageTaken += taken;
}

//------------------------------------------------------
// Вспомогательные функции
//------------------------------------------------------

export function applySkillGain(
  logs: EffectLog[],
  skill: 'melee' | 'range',
  before: number,
  after: number,
) {
  const delta = Math.floor(after) - Math.floor(before);
  if (delta) {
    logs.push({
      type: 'modifySkill',
      skill,
      delta,
      newValue: after,
    });
  }
}

export function tryGainCon(logs: EffectLog[], character: Character, taken: number, maxHp: number) {
  const damageRatio = taken / maxHp;

  if (damageRatio >= 0.8 && taken < character.hp) {
    if (Math.random() < 0.4) {
      character.mainStats.con += 1;
      logs.push({
        type: 'modifyMainStat',
        stat: 'con',
        delta: 1,
        newValue: character.mainStats.con,
      });
    }
  }
}

export function tryGainStr(
  logs: EffectLog[],
  character: Character,
  metrics: CharacterCombatMetrics,
) {
  const characterStr = character.mainStats.str;
  const hits = metrics.melee?.hits ?? 0;
  const dmg = metrics.melee?.totalDamageDealt ?? 0;

  if (dmg >= characterStr * 2 && hits >= 5 && Math.random() < 0.4) {
    character.mainStats.str++;
    logs.push({
      type: 'modifyMainStat',
      stat: 'str',
      delta: 1,
      newValue: character.mainStats.str,
    });
  }
}

export function tryGainPer(
  logs: EffectLog[],
  character: Character,
  metrics: CharacterCombatMetrics,
) {
  const characterPer = character.mainStats.per ?? 0;
  const hits = metrics.range?.hits ?? 0;
  const dmg = metrics.range?.totalDamageDealt ?? 0;

  if (hits >= 5 && dmg >= characterPer * 2 && Math.random() < 0.4) {
    character.mainStats.per++;
    logs.push({
      type: 'modifyMainStat',
      stat: 'per',
      delta: 1,
      newValue: character.mainStats.per,
    });
  }
}

export function tryGainDex(
  logs: EffectLog[],
  character: Character,
  metrics: CharacterCombatMetrics,
  taken: number,
  maxHp: number,
) {
  const characterDex = character.mainStats.dex ?? 0;
  const dodges = metrics.hitsEvaded ?? 0;
  const hits = metrics.hitsReceived ?? 0;
  const total = dodges + hits;

  if (dodges < 5) return;

  const dodgeRate = dodges / total;
  const enoughDodges = dodgeRate >= 0.6 && dodgeRate <= 0.9;
  const tookRealDamage = taken >= maxHp * 0.25;

  if (enoughDodges && tookRealDamage) {
    character.mainStats.dex = characterDex + 1;

    logs.push({
      type: 'modifyMainStat',
      stat: 'dex',
      delta: 1,
      newValue: character.mainStats.dex,
    });
  }
}

export function applyInjuryAndWill(
  logs: EffectLog[],
  state: StoreState, // Это WritableDraft от Immer
  characterId: string,
  character: Character,
) {
  // 0. Базовый шанс: 80%
  if (Math.random() >= 0.8) return;

  if (!state.traits.traitsByCharacterId[characterId]) {
    state.traits.traitsByCharacterId[characterId] = [];
  }
  const traits = state.traits.traitsByCharacterId[characterId];
  const existingIndex = traits.findIndex((t) => t.id === 'injury');
  const existing = traits[existingIndex];

  // 1. Ролл уровня травмы
  const roll = Math.random();
  let rolledLevel = 0;
  if (roll >= 0.95) rolledLevel = 2;
  else if (roll >= 0.85) rolledLevel = 1;

  const maxLevel = traitsRegistry.getMaxLevelIndex('injury');

  // 2. Логика добавления/апгрейда
  if (!existing) {
    // --- СОЗДАНИЕ НОВОГО ---
    const levelToSet = Math.min(rolledLevel, maxLevel);

    const newTrait = traitsRegistry.createActiveTrait('injury', levelToSet);

    if (newTrait) {
      traits.push(newTrait);

      logs.push({
        type: 'addTrait',
        traitId: 'injury',
        level: levelToSet,
      });
    }
  } else {
    // --- ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕГО ---
    const combinedLevel = existing.level + (rolledLevel + 1);

    if (combinedLevel <= maxLevel) {
      const newTrait = traitsRegistry.createActiveTrait('injury', combinedLevel);

      if (newTrait) {
        traits[existingIndex] = newTrait;

        logs.push({
          type: 'levelUpTrait',
          traitId: 'injury',
          deltaLevel: combinedLevel - existing.level,
          newLevel: combinedLevel,
        });
      }
    } else {
      const newTrait = traitsRegistry.createActiveTrait('injury', maxLevel)!;
      const overflow = combinedLevel - maxLevel;
      const extraDuration = overflow * newTrait.duration!;
      const currentDuration = existing.duration ?? 0;
      const newDuration = currentDuration + extraDuration;
      newTrait.duration = newDuration;

      if (existing.level < maxLevel) {
        logs.push({
          type: 'levelUpTrait',
          traitId: 'injury',
          deltaLevel: maxLevel - existing.level,
          newLevel: maxLevel,
        });
      }

      logs.push({
        type: 'setDuration',
        traitId: 'injury',
        newValue: newDuration,
      });

      traits[existingIndex] = newTrait;
    }
  }

  // 4. Шанс на Willpower
  const willChance = 0.3 + rolledLevel * 0.3;
  if (Math.random() < willChance) {
    const newWill = (character.mainStats.will ?? 0) + 1;
    character.mainStats.will = newWill;

    logs.push({
      type: 'modifyMainStat',
      stat: 'will',
      delta: 1,
      newValue: newWill,
    });
  }
}

//------------------------------------------------------
// Точка входа — вызывается из processBattleEnd в CharactersSlice
//------------------------------------------------------

export function processBattleGrowth(
  state: StoreState,
  characterId: string,
  metrics: CharacterCombatMetrics,
): EffectLog[] {
  const logs: EffectLog[] = [];
  const character = state.characters.byId[characterId];
  if (!character) return logs;

  const { mainStats, baseStats } = character;
  const maxHp = calculateMaxHp(mainStats, baseStats);
  const taken = metrics.damageTaken ?? 0;

  // Skill training
  const meleeBefore = character.skills.melee ?? 0;
  const meleeAfter = meleeBefore + (metrics.melee?.misses ?? 0) * 0.1;
  if (meleeAfter !== meleeBefore) {
    character.skills.melee = meleeAfter;
    applySkillGain(logs, 'melee', meleeBefore, meleeAfter);
  }

  const rangeBefore = character.skills.range ?? 0;
  const rangeAfter = rangeBefore + (metrics.range?.misses ?? 0) * 0.1;
  if (rangeAfter !== rangeBefore) {
    character.skills.range = rangeAfter;
    applySkillGain(logs, 'range', rangeBefore, rangeAfter);
  }

  // Main stat training
  tryGainCon(logs, character, taken, maxHp);
  tryGainStr(logs, character, metrics);
  tryGainPer(logs, character, metrics);
  tryGainDex(logs, character, metrics, taken, maxHp);

  // Injury
  if (taken >= character.hp) {
    character.hp = 1; // leave alive
    applyInjuryAndWill(logs, state, characterId, character);
  }

  return logs;
}
