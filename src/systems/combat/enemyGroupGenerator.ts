import { LOWER_LEVEL_CHANCE, MAX_MEMBERS, SAME_LEVEL_CHANCE } from '@/data/combat.rules';
import type { EnemyTemplate } from '@/types/enemy.types';

import { enemyFactory } from '../enemy/enemyFactory';

// type GroupGenOptions = {
//   difficultyLevel: number; // целевой уровень боя
//   budget: number; // общий бюджет (напр., 2 для самой лёгкой)
//   maxMembers?: number; // по умолчанию 5
//   allowedTemplates?: string[]; // опционально, если нужно ограничить пул
//   pSame?: number; // 0.7 по умолчанию
//   pDown?: number; // 0.15
//   pUp?: number; // 0.15
// };

type GroupGenOptions = {
  difficultyLevel: number;
  budget: number;
  allowedTemplates: EnemyTemplate[];
};

const pickLevel = (base: number) => {
  const r = Math.random();
  if (r < SAME_LEVEL_CHANCE) return base;
  if (r < SAME_LEVEL_CHANCE + LOWER_LEVEL_CHANCE) return base - 1;
  return base + 1;
};

const randomTemplateIdForLevel = (level: number, pool: EnemyTemplate[]): string | null => {
  // простой выбор: любой шаблон, который может иметь этот level (tier ∈ {0,1,2})
  const candidates = pool.filter((enemy) => {
    const tier = level - enemy.baseLevel;
    return tier >= 0 && tier <= 2;
  });
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].templateId;
};

const enemyCost = (level: number) => Math.max(1, level);

export function generateEnemyGroup(opts: GroupGenOptions) {
  console.log('Generating enemy group with options:');

  const { difficultyLevel, budget, allowedTemplates } = opts;
  const group = [];
  let remaining = budget;

  // минимально возможная цена — 1 (уровень не опускаем ниже 1)
  while (group.length < MAX_MEMBERS && remaining >= 1) {
    let level = pickLevel(difficultyLevel);
    if (level < 1) level = 1;

    // 2) если выбранный уровень дороже оставшегося бюджета — подрезать до бюджета,
    //    но всё равно держать в окне ±1 относительно сложности
    if (enemyCost(level) > remaining) {
      if (remaining > 0 && difficultyLevel - 1 <= remaining)
        level = remaining; // подгоняем вниз
      else break; // не можем позволить даже самого дешёвого
    }

    // 3) выбрать шаблон, который поддерживает этот level
    const templateId = randomTemplateIdForLevel(level, allowedTemplates);
    if (!templateId) break; // нет подходящих в пуле

    // 4) создать врага
    const enemy = enemyFactory.createEnemyInstance(templateId, level);
    console.log(enemy);
    if (!enemy) break; // фабрика не смогла — просто выходим

    // 5) учесть стоимость и добавить
    remaining -= enemyCost(level);
    group.push(enemy);
  }

  return group; // может быть пустым — это ок на данном этапе
}
