import { ARMOR_RARITY_MULTIPLIERS_DEFAULT, ARMOR_TEMPLATES_DB } from '@/data/armor.templates';
import { WEAPON_RARITY_MULTIPLIERS_DEFAULT, WEAPON_TEMPLATES_DB } from '@/data/weapon.templates';
import type { ArmorInstance } from '@/types/armor.types';
import type { Rarity } from '@/types/common.types';
import type { WeaponInstance } from '@/types/weapon.types';
import { makeInstanceId } from '@/utils/utils.js';

/**
 * A reusable helper function to calculate final item modifiers based on rarity.
 * It multiplies positive values (bonuses) and divides negative values (penalties).
 * @param baseMods The base modifiers from the item template.
 * @param multiplier The rarity multiplier to apply.
 * @returns A new record with the calculated modifiers.
 */
const calculateRarityMods = (
  baseMods: Record<string, number>,
  multiplier: number,
): Record<string, number> => {
  const finalMods: Record<string, number> = {};
  for (const key in baseMods) {
    const value = baseMods[key];
    if (value > 0) {
      finalMods[key] = Math.round(value * multiplier);
    } else if (value < 0) {
      finalMods[key] = Math.round(value / multiplier);
    } else {
      finalMods[key] = 0;
    }
  }
  return finalMods;
};

/**
 * A factory for creating "live" instances of items from their templates.
 */
export const equipmentFactory = {
  /**
   * Creates an armor instance with stats calculated based on its rarity.
   * @param templateId The ID of the armor template from the database.
   * @param rarity The desired rarity of the instance.
   * @returns A new ArmorInstance object, or null if the templateId is invalid.
   */
  createArmorInstance: (templateId: string, rarity: Rarity): ArmorInstance | null => {
    const template = ARMOR_TEMPLATES_DB[templateId];

    if (!template) {
      console.warn(`[equipmentFactory] Armor template with id "${templateId}" not found.`);
      return null;
    }

    const { rarityMultipliers, mods: templateMods = {}, price, ...rest } = template;

    if (rarity === 'common') {
      return {
        ...rest,
        instanceId: makeInstanceId(),
        rarity: 'common',
        price,
        mods: { ...templateMods }, // Create a copy
      };
    }

    const multipliers = rarityMultipliers ?? ARMOR_RARITY_MULTIPLIERS_DEFAULT;
    const multiplier = multipliers[rarity] ?? 1;

    const finalMods = calculateRarityMods(templateMods, multiplier);
    const finalPrice = Math.round(price * Math.pow(multiplier, 2));

    const instance: ArmorInstance = {
      ...rest,
      instanceId: makeInstanceId(),
      rarity,
      price: finalPrice,
      mods: finalMods,
    };

    return instance;
  },

  /**
   * Creates a weapon instance with stats calculated based on its rarity.
   * Rarity affects core stats (damage, armorPiercing) and price directly,
   * and secondary mods via the standard modifier calculation.
   * @param templateId The ID of the weapon template from the database.
   * @param rarity The desired rarity of the instance.
   * @returns A new WeaponInstance object, or null if the templateId is invalid.
   */
  createWeaponInstance: (templateId: string, rarity: Rarity): WeaponInstance | null => {
    const template = WEAPON_TEMPLATES_DB[templateId];

    if (!template) {
      console.warn(`[equipmentFactory] Weapon template with id "${templateId}" not found.`);
      return null;
    }

    const {
      rarityMultipliers,
      mods: templateMods = {},
      price,
      damage, // [min, max]
      armorPiercing,
      ...rest
    } = template;

    if (rarity === 'common') {
      return {
        ...rest,
        instanceId: makeInstanceId(),
        rarity: 'common',
        price,
        damage: [...damage], // Create a copy
        armorPiercing,
        mods: { ...templateMods }, // Create a copy
      };
    }

    const multipliers = rarityMultipliers ?? WEAPON_RARITY_MULTIPLIERS_DEFAULT;
    const multiplier = multipliers[rarity] ?? 1;

    // Calculate final stats based on rarity
    const finalPrice = Math.round(price * Math.pow(multiplier, 2));
    const finalMods = calculateRarityMods(templateMods, multiplier);
    const finalArmorPiercing = Math.round(armorPiercing * multiplier);
    const finalDamage: [number, number] = [
      Math.round(damage[0] * multiplier),
      Math.round(damage[1] * multiplier),
    ];

    const instance: WeaponInstance = {
      ...rest,
      instanceId: makeInstanceId(),
      rarity,
      price: finalPrice,
      damage: finalDamage,
      armorPiercing: finalArmorPiercing,
      mods: finalMods,
    };

    return instance;
  },
};
