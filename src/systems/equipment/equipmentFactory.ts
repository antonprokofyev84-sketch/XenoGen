// src/factories/equipment/equipmentFactory.ts
import { ARMOR_RARITY_MULTIPLIERS_DEFAULT, ARMOR_TEMPLATES_DB } from '@/data/armor.templates';
import { WEAPON_RARITY_MULTIPLIERS_DEFAULT, WEAPON_TEMPLATES_DB } from '@/data/weapon.templates';
import type { ArmorInstance } from '@/types/armor.types';
import type { StatBlock } from '@/types/character.types';
import type { Rarity } from '@/types/common.types';
import type { WeaponInstance } from '@/types/weapon.types';

/**
 * Хелпер для масштабирования группы статов.
 * Принимает любой объект { ключ: число } и множитель.
 * Без дженериков и лишних приведений типов.
 */
const scaleStatGroup = (
  group: Record<string, number> | undefined,
  multiplier: number,
): Record<string, number> | undefined => {
  if (!group) return undefined;

  const result: Record<string, number> = {};

  for (const key in group) {
    const value = group[key];

    // Простая проверка типа, чтобы TS понимал, что это число
    if (typeof value === 'number') {
      if (value > 0) {
        result[key] = Math.round(value * multiplier);
      } else if (value < 0) {
        // Штрафы уменьшаются с ростом редкости (делим на множитель)
        result[key] = Math.round(value / multiplier);
      } else {
        result[key] = 0;
      }
    }
  }

  return result;
};

/**
 * Применяет множитель редкости ко всей структуре StatBlock.
 * Использует цикл для автоматической обработки всех категорий статов в StatBlock.
 */
const calculateRarityModifiers = (
  baseModifiers: StatBlock = {},
  rarityMultiplier: number,
): StatBlock => {
  const result: StatBlock = {};
  // Получаем все ключи, присутствующие в базовых модификаторах
  const keys = Object.keys(baseModifiers) as Array<keyof StatBlock>;

  for (const key of keys) {
    const group = baseModifiers[key];

    if (group) {
      // Используем scaleStatGroup для каждой найденной категории.
      result[key] = scaleStatGroup(group, rarityMultiplier);
    }
  }

  return result;
};

/** Детерминированные рассчитанные поля для брони. */
type ArmorComputedStats = {
  price: number;
  mods: StatBlock; // <-- Обновленный тип
};

/** Детерминированные рассчитанные поля для оружия. */
type WeaponComputedStats = {
  price: number;
  damage: [number, number];
  armorPiercing: number;
  mods: StatBlock; // <-- Обновленный тип
};

/** Простой кэш только для детерминированных вычислений. */
const armorComputedCacheMap = new Map<string, ArmorComputedStats>(); // key: `${templateId}|${rarity}`
const weaponComputedCacheMap = new Map<string, WeaponComputedStats>(); // key: `${templateId}|${rarity}`

const makeArmorCacheKey = (templateId: string, rarity: Rarity) => `${templateId}|${rarity}`;
const makeWeaponCacheKey = (templateId: string, rarity: Rarity) => `${templateId}|${rarity}`;

/** Единый расчёт статов брони по (templateId, rarity). */
function computeArmorStats(templateId: string, rarity: Rarity): ArmorComputedStats | null {
  const template = ARMOR_TEMPLATES_DB[templateId];
  if (!template) return null;

  // Если common, просто копируем структуру без вычислений
  if (rarity === 'common') {
    return {
      price: template.price,
      // Используем нативный structuredClone для глубокой копии
      mods: template.mods ? structuredClone(template.mods) : {},
    };
  }

  const rarityMultipliers = template.rarityMultipliers ?? ARMOR_RARITY_MULTIPLIERS_DEFAULT;
  const rarityMultiplier = rarityMultipliers[rarity] ?? 1;

  return {
    price: Math.round(template.price * rarityMultiplier * rarityMultiplier),
    mods: calculateRarityModifiers(template.mods ?? {}, rarityMultiplier),
  };
}

/** Единый расчёт статов оружия по (templateId, rarity). */
function computeWeaponStats(templateId: string, rarity: Rarity): WeaponComputedStats | null {
  const template = WEAPON_TEMPLATES_DB[templateId];
  if (!template) return null;

  if (rarity === 'common') {
    return {
      price: template.price,
      damage: [...template.damage] as [number, number],
      armorPiercing: template.armorPiercing,
      // Используем нативный structuredClone для глубокой копии
      mods: template.mods ? structuredClone(template.mods) : {},
    };
  }

  const rarityMultipliers = template.rarityMultipliers ?? WEAPON_RARITY_MULTIPLIERS_DEFAULT;
  const rarityMultiplier = rarityMultipliers[rarity] ?? 1;

  return {
    price: Math.round(template.price * rarityMultiplier * rarityMultiplier),
    damage: [
      Math.round(template.damage[0] * rarityMultiplier),
      Math.round(template.damage[1] * rarityMultiplier),
    ],
    armorPiercing: Math.round(template.armorPiercing * rarityMultiplier),
    mods: calculateRarityModifiers(template.mods ?? {}, rarityMultiplier),
  };
}

/** Достаёт рассчитанные статы брони из кэша или считает и кладёт. */
function getArmorStatsCached(templateId: string, rarity: Rarity): ArmorComputedStats | null {
  const cacheKey = makeArmorCacheKey(templateId, rarity);
  const cached = armorComputedCacheMap.get(cacheKey);
  if (cached) return cached;

  const computed = computeArmorStats(templateId, rarity);
  if (computed) armorComputedCacheMap.set(cacheKey, computed);
  return computed;
}

/** Достаёт рассчитанные статы оружия из кэша или считает и кладёт. */
function getWeaponStatsCached(templateId: string, rarity: Rarity): WeaponComputedStats | null {
  const cacheKey = makeWeaponCacheKey(templateId, rarity);
  const cached = weaponComputedCacheMap.get(cacheKey);
  if (cached) return cached;

  const computed = computeWeaponStats(templateId, rarity);
  if (computed) weaponComputedCacheMap.set(cacheKey, computed);
  return computed;
}

/** Публичная фабрика. */
export const equipmentFactory = {
  /** Сбросить оба кэша (например, после правок баланса). */
  clearCache(): void {
    armorComputedCacheMap.clear();
    weaponComputedCacheMap.clear();
  },

  /** Лёгкие превью: детерминированные статы без создания instanceId. */
  getArmorPreview(templateId: string, rarity: Rarity) {
    return getArmorStatsCached(templateId, rarity);
  },
  getWeaponPreview(templateId: string, rarity: Rarity) {
    return getWeaponStatsCached(templateId, rarity);
  },

  /** Полный инстанс брони: добавляем instanceId и переносим статические поля шаблона. */
  createArmorInstance(templateId: string, rarity: Rarity): ArmorInstance | null {
    const template = ARMOR_TEMPLATES_DB[templateId];
    if (!template) {
      console.warn(`[equipmentFactory] Armor template "${templateId}" not found.`);
      return null;
    }

    const computed = getArmorStatsCached(templateId, rarity);
    if (!computed) return null;

    // Берём все поля шаблона, кроме служебного rarityMultipliers (остальные перезапишем computed-полями)
    const { rarityMultipliers, ...templateFields } = template;

    // Предполагается, что интерфейс ArmorInstance уже обновлен и ожидает mods: StatBlock
    const armorInstance: ArmorInstance = {
      ...templateFields,
      rarity,
      price: computed.price,
      mods: computed.mods,
    };
    return armorInstance;
  },

  /** Полный инстанс оружия: добавляем instanceId и переносим статические поля шаблона. */
  createWeaponInstance(templateId: string, rarity: Rarity): WeaponInstance | null {
    const template = WEAPON_TEMPLATES_DB[templateId];
    if (!template) {
      console.warn(`[equipmentFactory] Weapon template "${templateId}" not found.`);
      return null;
    }

    const computed = getWeaponStatsCached(templateId, rarity);
    if (!computed) return null;

    const { rarityMultipliers, ...templateFields } = template;

    // Предполагается, что интерфейс WeaponInstance уже обновлен и ожидает mods: StatBlock
    const weaponInstance: WeaponInstance = {
      ...templateFields,
      rarity,
      price: computed.price,
      damage: computed.damage,
      armorPiercing: computed.armorPiercing,
      mods: computed.mods,
    };
    return weaponInstance;
  },
};
