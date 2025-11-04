import { DEFAULT_ARMOR_ID, DEFAULT_MELEE_ID } from '@/constants';
import { RARITY_RULES } from '@/data/enemy.rules';
import { ENEMY_RARITY_CHANCE, EQUIPMENT_BY_TIER_CHANCE, TIER_UP_DELTAS } from '@/data/enemy.rules';
import { MAX_ENEMY_TIER, MIN_ENEMY_TIER } from '@/data/enemy.rules';
import { ENEMY_TEMPLATES_DB } from '@/data/enemy.templates';
import type { CombatStats, CombatUnit } from '@/types/combat.types';
import type { Rarity } from '@/types/common.types';
import type { EquipmentItem } from '@/types/equipment.types';
import type { WeaponSlots } from '@/types/equipment.types';
import type { WeaponInstance } from '@/types/weapon.types';
import { makeInstanceId } from '@/utils/utils';

import { equipmentFactory } from '../equipment/equipmentFactory';

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

const applyMods = (stats: CombatStats, mods?: Record<string, number>) => {
  if (!mods) return;
  for (const [key, value] of Object.entries(mods)) {
    if (key in stats) stats[key as keyof CombatStats] += value;
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
   * @returns Объект CombatUnit или null, если шаблон не найден.
   */
  createEnemyInstance: (templateId: string, level: number): CombatUnit | null => {
    const template = ENEMY_TEMPLATES_DB[templateId];

    if (!template) {
      console.warn(`[enemyFactory] Template with id "${templateId}" not found.`);
      return null;
    }

    const tier = level - template.baseLevel;

    if (tier < MIN_ENEMY_TIER || tier > MAX_ENEMY_TIER) {
      console.warn(
        `[enemyFactory] Cannot create enemy "${templateId}" of level ${level} (based on baseLevel ${template.baseLevel}).`,
      );
      return null;
    }

    // --- Шаг 1: Расчет характеристик по уровню ---
    let finalStats: CombatStats;
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
          const statKey = key as keyof CombatStats;
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
        const statKey = key as keyof CombatStats;
        const rule = rarityRules[statKey];
        if (rule && finalStats[statKey] !== undefined) {
          finalStats[statKey] = rule(finalStats[statKey]);
        }
      }
    }

    // --- Шаг 3: Генерация и интеграция снаряжения ---
    const tierChances = EQUIPMENT_BY_TIER_CHANCE[tier as keyof typeof EQUIPMENT_BY_TIER_CHANCE];

    // Вспомогательная функция для чистоты кода
    const createWeapon = (weaponId?: string): WeaponInstance | null => {
      if (!weaponId) return null;
      const rarity = getMaxRarity(getRandomKeyByWeight(tierChances) as Rarity, enemyRarity);
      return equipmentFactory.createWeaponInstance(weaponId, rarity);
    };

    let meleeInstance = createWeapon(template.equipment.meleeId);
    let rangeInstance = createWeapon(template.equipment.rangeId);

    // Дефолтное оружие, если ни одного не указано
    if (!meleeInstance && !rangeInstance) {
      meleeInstance = createWeapon(DEFAULT_MELEE_ID);
    }

    // Броня (используем дефолтную, если не указана)
    const armorIdToCreate = template.equipment.armorId ?? DEFAULT_ARMOR_ID;
    const armorRarity = getMaxRarity(getRandomKeyByWeight(tierChances) as Rarity, enemyRarity);
    const armorInstance = equipmentFactory.createArmorInstance(armorIdToCreate, armorRarity);

    // Гаджет (если есть)
    let gadgetInstance: EquipmentItem | null = null;
    if (template.equipment.gadgetId) {
      const rarity = getMaxRarity(getRandomKeyByWeight(tierChances) as Rarity, enemyRarity);
      gadgetInstance = { templateId: template.equipment.gadgetId, rarity };
    }

    // Применяем моды от всей экипировки
    applyMods(finalStats, meleeInstance?.mods);
    applyMods(finalStats, rangeInstance?.mods);
    applyMods(finalStats, armorInstance?.mods);
    // applyMods(finalStats, gadgetInstance?.mods);

    // --- Шаг 4: Сборка финального объекта (ОБНОВЛЕНО) ---

    const finalMelee = meleeInstance ? { ...meleeInstance, mods: {} } : null;
    const finalRange = rangeInstance ? { ...rangeInstance, mods: {} } : null;

    const finalArmor = armorInstance
      ? { templateId: armorInstance.templateId, rarity: armorInstance.rarity }
      : null;
    const finalGadget = gadgetInstance;

    const activeWeaponSlot: WeaponSlots = finalRange ? 'rangePrimary' : 'meleePrimary';

    for (const key in finalStats) {
      const statKey = key as keyof CombatStats;
      finalStats[statKey] = Math.round(finalStats[statKey]);
    }

    const instance: CombatUnit = {
      instanceId: makeInstanceId(),
      templateId: template.templateId,
      faction: template.faction,
      appearanceVariation: Math.floor(Math.random() * (template.appearanceVariation ?? 1)),
      level,
      rarity: enemyRarity,
      stats: finalStats,
      status: 'alive',
      position: 3,
      equipment: {
        meleePrimary: finalMelee,
        rangePrimary: finalRange,
        meleeSecondary: null,
        rangeSecondary: null,
        armor: finalArmor,
        gadget: finalGadget,
      },
      activeWeaponSlot,
    };

    return instance;
  },
};
