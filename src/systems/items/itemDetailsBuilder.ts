import { ITEMS_TEMPLATES_DB } from '@/data/items.templates';
import textData from '@/locales/en.json';
import { equipmentFactory } from '@/systems/equipment/equipmentFactory';
import type { ArmorInstance, ArmorTemplate } from '@/types/armor.types';
import type { InventoryItem } from '@/types/inventory.types';
import type { WeaponInstance, WeaponTemplate } from '@/types/weapon.types';

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------

export interface DetailRow {
  label: string;
  value: string | number;
  highlight?: 'positive' | 'negative'; // Добавлено для раскраски
}

export interface RequirementRow extends DetailRow {
  isMet: boolean;
  currentValue: number;
  requiredValue: number;
}

export interface ItemDetailsData {
  baseRows: DetailRow[];
  modRows: DetailRow[];
  requirementRows: RequirementRow[];
  price: number;
  description: string;
}

// Внутренний тип для плоских статов
interface FlatStat {
  category: string; // mainStats / secondaryStats / skills / etc
  statKey: string; // str / armor / range / etc
  value: number;
}

// -------------------------------------------------------------
// LOCALIZATION HELPERS
// -------------------------------------------------------------

const getStatLabel = (category: string, statKey: string): string => {
  // @ts-ignore
  return textData?.[category]?.[statKey] ?? `${category}.${statKey}`;
};

const getItemDescription = (templateId: string): string => {
  // @ts-ignore
  return textData.items?.[templateId]?.desc ?? '';
};

// -------------------------------------------------------------
// SHARED HELPERS
// -------------------------------------------------------------

const flattenStats = (source: any = {}, excludeStatKeys: string[] = []): FlatStat[] => {
  const rows: FlatStat[] = [];

  for (const [category, group] of Object.entries(source)) {
    if (!group) continue;

    const typedGroup = group as Record<string, number>;

    for (const [statKey, value] of Object.entries(typedGroup)) {
      if (excludeStatKeys.includes(statKey)) {
        continue;
      }

      rows.push({
        category,
        statKey,
        value,
      });
    }
  }

  return rows;
};

const buildRequirementRows = (
  requirements: any = {},
  characterStats: Record<string, any>,
): RequirementRow[] => {
  const flatStats = flattenStats(requirements);
  const result: RequirementRow[] = [];

  for (const { category, statKey, value: requiredValue } of flatStats) {
    const currentGroup = (characterStats as Record<string, Record<string, number> | undefined>)[
      category
    ];

    const currentValue = currentGroup?.[statKey] ?? 0;
    const isMet = currentValue >= requiredValue;

    result.push({
      label: getStatLabel(category, statKey),
      value: requiredValue,
      currentValue,
      requiredValue,
      isMet,
    });
  }

  return result;
};

/**
 * Моды: разворачиваем и исключаем часть статов
 */
const buildModRows = (mods: any = {}, excludeStatKeys: string[] = []): DetailRow[] => {
  const flatStats = flattenStats(mods, excludeStatKeys);
  const result: DetailRow[] = [];

  for (const { category, statKey, value } of flatStats) {
    const label = getStatLabel(category, statKey);
    const formattedValue = value > 0 ? `+${value}` : `${value}`;

    // Определяем цвет: положительные - positive, отрицательные - negative
    const highlight = value > 0 ? 'positive' : 'negative';

    result.push({
      label,
      value: formattedValue,
      highlight,
    });
  }

  return result;
};

// -------------------------------------------------------------
// ITEM-SPECIFIC BUILDERS
// -------------------------------------------------------------

const buildWeaponDetails = (
  item: InventoryItem,
  characterStats: Record<string, any>,
): ItemDetailsData | null => {
  const template = ITEMS_TEMPLATES_DB[item.templateId] as WeaponTemplate;
  if (!template) return null;

  const instance = equipmentFactory.createWeaponInstance(
    item.templateId,
    item.rarity,
  ) as WeaponInstance;

  if (!instance) return null;

  const baseRows: DetailRow[] = [];
  // @ts-ignore
  const ws = textData.weaponStats || {};

  // Damage
  baseRows.push({
    label: ws.damage ?? 'Damage',
    value: `${instance.damage[0]}–${instance.damage[1]}`,
  });

  // Armor piercing
  if (instance.armorPiercing) {
    baseRows.push({
      label: ws.armorPiercing ?? 'Armor Piercing',
      value: instance.armorPiercing,
    });
  }

  // Range (без "m")
  if (template.distance) {
    baseRows.push({
      label: ws.distance ?? 'Range',
      value: template.distance,
    });
  }

  // Attacks per turn
  if (template.attacksPerTurn) {
    baseRows.push({
      label: ws.attacksPerTurn ?? 'Attacks/Turn',
      value: template.attacksPerTurn,
    });
  }

  // Lethality
  if (template.lethality) {
    baseRows.push({
      label: ws.lethality ?? 'Lethality',
      value: `${Math.round(template.lethality * 100)}%`,
    });
  }

  return {
    baseRows,
    modRows: buildModRows(instance.mods),
    requirementRows: buildRequirementRows(template.requirements, characterStats),
    price: Math.round(instance.price ?? 0),
    description: getItemDescription(item.templateId),
  };
};

const buildArmorDetails = (
  item: InventoryItem,
  characterStats: Record<string, any>,
): ItemDetailsData | null => {
  const template = ITEMS_TEMPLATES_DB[item.templateId] as ArmorTemplate;
  if (!template) return null;

  const instance = equipmentFactory.createArmorInstance(
    item.templateId,
    item.rarity,
  ) as ArmorInstance;

  if (!instance) return null;

  const baseRows: DetailRow[] = [];

  const armorValue = instance.mods?.secondaryStats?.armor ?? 0;

  baseRows.push({
    label: getStatLabel('secondaryStats', 'armor'),
    value: armorValue,
  });

  return {
    baseRows,
    modRows: buildModRows(instance.mods, ['armor']),
    requirementRows: buildRequirementRows(template.requirements, characterStats),
    price: Math.round(instance.price ?? 0),
    description: getItemDescription(item.templateId),
  };
};

const buildGenericDetails = (item: InventoryItem): ItemDetailsData | null => {
  const template = ITEMS_TEMPLATES_DB[item.templateId];
  if (!template) return null;

  return {
    baseRows: [],
    modRows: [],
    requirementRows: [],
    price: Math.round(template.price ?? 0),
    description: getItemDescription(item.templateId),
  };
};

// -------------------------------------------------------------
// MAIN DISPATCH FUNCTION
// -------------------------------------------------------------

export const buildItemDetails = (
  item: InventoryItem,
  characterStats: Record<string, any> = {},
): ItemDetailsData | null => {
  switch (item.type) {
    case 'meleeWeapon':
    case 'rangeWeapon':
      return buildWeaponDetails(item, characterStats);

    case 'armor':
      return buildArmorDetails(item, characterStats);

    default:
      return buildGenericDetails(item);
  }
};
