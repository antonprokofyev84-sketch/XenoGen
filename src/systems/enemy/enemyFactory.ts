import { DEFAULT_ARMOR_ID, DEFAULT_MELEE_ID } from '@/constants';
import { RARITY_RULES } from '@/data/enemy.rules';
import { ENEMY_RARITY_CHANCE, EQUIPMENT_BY_TIER_CHANCE, TIER_UP_DELTAS } from '@/data/enemy.rules';
import { MAX_ENEMY_TIER, MIN_ENEMY_TIER } from '@/data/enemy.rules';
import { ENEMY_TEMPLATES_DB } from '@/data/enemy.templates';
import type { StatBlock } from '@/types/character.types';
import type { CombatStats, CombatUnit } from '@/types/combat.types';
import type { Rarity } from '@/types/common.types';
import type { WeaponSlots } from '@/types/equipment.types';
import type { InventoryItem } from '@/types/inventory.types';
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

const flattenMods = (mods: StatBlock): Record<string, number> => {
  let flat: Record<string, number> = {};

  for (const group of Object.values(mods)) {
    if (group) {
      flat = { ...flat, ...group };
    }
  }

  return flat;
};

const applyMods = (baseStats: CombatStats, mods?: StatBlock): CombatStats => {
  const modifiedStats = { ...baseStats };
  if (!mods) return modifiedStats;

  // 1. Сплющиваем структуру модов
  const flatMods = flattenMods(mods);

  for (const modKey in modifiedStats) {
    const modValue = flatMods[modKey];
    if (modValue === undefined) continue;

    modifiedStats[modKey as keyof CombatStats] += modValue;
  }

  return modifiedStats;
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
    // let gadgetInstance: EquipmentItem | null = null;
    // if (template.equipment.gadgetId) {
    //   const rarity = getMaxRarity(getRandomKeyByWeight(tierChances) as Rarity, enemyRarity);
    //   gadgetInstance = { templateId: template.equipment.gadgetId, rarity };
    // }

    // for now i descide to not apply weapon mods to enemy stats here as they will be applied in combatHelpers during combat calculations
    // applying them here reduces calculation during combat but makes differneces between enemies and party members calculations
    // Применяем моды от всей экипировки
    // finalStats = applyMods(finalStats, meleeInstance?.mods);
    // finalStats = applyMods(finalStats, rangeInstance?.mods);
    finalStats = applyMods(finalStats, armorInstance?.mods);
    // applyMods(finalStats, gadgetInstance?.mods);

    // --- Шаг 4: Сборка финального объекта (ОБНОВЛЕНО) ---

    const finalMelee = meleeInstance || null;
    const finalRange = rangeInstance || null;

    const finalArmor: InventoryItem | null = armorInstance
      ? {
          templateId: armorInstance.templateId,
          rarity: armorInstance.rarity,
          type: armorInstance.type,
          quantity: 1,
        }
      : null;
    // const finalGadget = gadgetInstance;

    const activeWeaponSlot: WeaponSlots = finalRange ? 'rangePrimary' : 'meleePrimary';

    for (const key in finalStats) {
      const statKey = key as keyof CombatStats;
      finalStats[statKey] = Math.round(finalStats[statKey]);
    }

    const instance: CombatUnit = {
      id: makeInstanceId(),
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
        gadget: null,
        // gadget: finalGadget,
      },
      activeWeaponSlot,
    };

    console.log(instance.stats);

    return instance;
  },
};
