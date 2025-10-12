import { RARITY_RULES } from '@/data/enemy.rules';
import {
  ENEMY_RARITY_CHANCE,
  ENEMY_TEMPLATES_DB,
  EQUIPMENT_BY_TIER_CHANCE,
  TIER_UP_DELTAS,
} from '@/data/enemy.templates';
import type { ArmorInstance } from '@/types/armor.types.js';
import type { Rarity } from '@/types/common.types';
import type { EnemyInstance, EnemyStats } from '@/types/enemy.types';
import type { WeaponInstance } from '@/types/weapon.types.js';
import { makeInstanceId } from '@/utils/utils.js';

import { equipmentFactory } from '../equipment/equipmentFactory.js';

const RARITY_RANK: Record<Rarity, number> = { common: 0, uncommon: 1, rare: 2, unique: 3 };

const getMaxRarity = (rarity: Rarity, minRarity: Rarity): Rarity =>
  RARITY_RANK[rarity] < RARITY_RANK[minRarity] ? minRarity : rarity;

/**
 * Вспомогательная функция для получения случайного ключа из объекта с весами.
 * @param weights Объект, где ключ - это ID, а значение - его вес (шанс).
 * @returns Случайно выбранный ключ.
 */

const getRandomKeyByWeight = (weights: Record<string, number>): string => {
  let totalWeight = 0;
  for (const weight of Object.values(weights)) {
    totalWeight += weight;
  }

  let random = Math.random() * totalWeight;

  for (const [key, weight] of Object.entries(weights)) {
    if (random < weight) {
      return key;
    }
    random -= weight;
  }
  // Fallback в случае ошибок с плавающей точкой
  return Object.keys(weights)[0];
};

const applyMods = (stats: EnemyStats, mods?: Record<string, number>) => {
  if (!mods) return;
  for (const [key, value] of Object.entries(mods)) {
    if (key in stats) stats[key as keyof EnemyStats] += value;
  }
};

/**
 * Фабрика для создания "живых" экземпляров врагов.
 */
export const enemyFactory = {
  /**
   * Создает экземпляр врага на основе шаблона и желаемого уровня.
   * @param templateId ID шаблона из ENEMY_TEMPLATES_DB.
   * @param level Желаемый уровень врага.
   * @returns Объект EnemyInstance или null, если шаблон не найден.
   */
  createEnemyInstance: (templateId: string, level: number): EnemyInstance | null => {
    const template = ENEMY_TEMPLATES_DB[templateId];

    if (!template) {
      console.warn(`[enemyFactory] Template with id "${templateId}" not found.`);
      return null;
    }

    const tier = level - template.baseLevel;

    if (tier < 0 || tier > 2) {
      console.warn(
        `[enemyFactory] Cannot create enemy "${templateId}" of level ${level} (based on baseLevel ${template.baseLevel}).`,
      );
      return null;
    }

    // --- Шаг 1: Расчет характеристик по уровню ---
    let finalStats: EnemyStats;
    const overrideStats = template.tierOverrides?.[tier as keyof typeof template.tierOverrides];

    if (overrideStats) {
      // Если есть override, используем его поверх базовых статов.
      finalStats = { ...template.baseStats, ...overrideStats };
    } else {
      // Иначе, считаем по формуле.
      finalStats = { ...template.baseStats }; // Начинаем с копии
      if (tier > 0) {
        const scalingFactor = template.tierScalingFactor ?? 1;
        for (const key in finalStats) {
          const statKey = key as keyof EnemyStats;
          const delta = TIER_UP_DELTAS[statKey] ?? 0;
          finalStats[statKey] += delta * scalingFactor * tier;
        }
      }
    }

    // --- Шаг 2: Определение и применение редкости врага ---
    const enemyRarity = template.rarity ?? (getRandomKeyByWeight(ENEMY_RARITY_CHANCE) as Rarity);

    const rarityRules = RARITY_RULES[enemyRarity];
    if (rarityRules) {
      for (const key in rarityRules) {
        const statKey = key as keyof EnemyStats;
        const rule = rarityRules[statKey];
        if (rule && finalStats[statKey] !== undefined) {
          finalStats[statKey] = rule(finalStats[statKey]);
        }
      }
    }

    // --- Шаг 3: Генерация и интеграция снаряжения ---
    const tierChances = EQUIPMENT_BY_TIER_CHANCE[tier as keyof typeof EQUIPMENT_BY_TIER_CHANCE];
    let weaponInstance: WeaponInstance | null = null;
    if (template.weaponId) {
      // Оружие
      let weaponRarity = getMaxRarity(getRandomKeyByWeight(tierChances) as Rarity, enemyRarity);
      weaponInstance = equipmentFactory.createWeaponInstance(template.weaponId, weaponRarity);
      if (!weaponInstance) {
        console.error(
          `[enemyFactory] Failed to create weapon "${template.weaponId}" for enemy "${templateId}".`,
        );
        return null;
      }
      applyMods(finalStats, weaponInstance.mods);
    }

    let armorInstance: ArmorInstance | null = null;
    if (template.bodyArmorId) {
      // Броня
      let armorRarity = getMaxRarity(getRandomKeyByWeight(tierChances) as Rarity, enemyRarity);
      armorInstance = equipmentFactory.createArmorInstance(template.bodyArmorId, armorRarity);
      if (!armorInstance) {
        console.error(
          `[enemyFactory] Failed to create armor "${template.bodyArmorId}" for enemy "${templateId}".`,
        );
        return null; // Критическая ошибка, броня не найдена
      }
      applyMods(finalStats, armorInstance?.mods);
    }
    // --- Шаг 4: Сборка финального объекта ---

    const { mods, ...restOfWeapon } = weaponInstance as WeaponInstance; // Убираем моды из оружия
    let finalBodyArmor = armorInstance
      ? { id: armorInstance.id, rarity: armorInstance.rarity }
      : undefined;

    // Округляем все характеристики до целых чисел
    for (const key in finalStats) {
      const statKey = key as keyof EnemyStats;
      finalStats[statKey] = Math.round(finalStats[statKey]);
    }

    const instance: EnemyInstance = {
      instanceId: makeInstanceId(),
      templateId,
      characterTemplateId: template.characterTemplateId,
      faction: template.faction,
      level,
      rarity: enemyRarity,
      stats: finalStats,
      weapon: restOfWeapon,
      bodyArmor: finalBodyArmor,
    };

    return instance;
  },
};
