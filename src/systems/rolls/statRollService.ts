import type { StoreState } from '@/state/useGameState';
import { characterSelectors } from '@/state/useGameState';
import type { MainStatKey, SkillKey } from '@/types/character.types';

export interface StatRollParams {
  characterId: string;
  stat: SkillKey | MainStatKey;
  difficulty?: number; // сложность против которой кидаем
}

export interface StatRollResult {
  stat: SkillKey | MainStatKey;
  statValue: number;
  difficulty: number;
  totalChance: number;
  roll: number;
  success: boolean;
  difference: number;
}

export function rollStatCheck(
  state: StoreState,
  params: {
    characterId: string;
    stat: SkillKey | MainStatKey;
    difficulty?: number;
  },
): StatRollResult {
  const { characterId, stat, difficulty = 0 } = params;

  // 1. Получаем эффективные навыки
  const skills = characterSelectors.selectEffectiveSkills(characterId)(state);
  const mainStats = characterSelectors.selectEffectiveMainStats(characterId)(state);

  const statValue =
    (skills as Record<string, number>)[stat] ?? (mainStats as Record<string, number>)[stat] ?? 0;

  // 2. Считаем шанс
  const totalChance = 100 - difficulty + statValue;

  // 3. Кидаем d100
  const roll = Math.floor(Math.random() * 100) + 1;

  return {
    stat,
    statValue,
    difficulty,
    totalChance,
    roll,
    success: roll <= totalChance,
    difference: roll - totalChance,
  };
}
