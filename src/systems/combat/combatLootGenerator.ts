import { RARITY_ORDER } from '@/constants';
import { ARMOR_TEMPLATES_DB } from '@/data/armor.templates';
import { ENEMY_TEMPLATES_DB } from '@/data/enemy.templates';
import { LEVEL_BONUS, LOOT_RULES_BY_TEMPLATE } from '@/data/loot.rules';
import { WEAPON_TEMPLATES_DB } from '@/data/weapon.templates';
import type {
  AggregatedLootResult,
  CombatEquipment,
  CombatUnit,
  LootItem,
} from '@/types/combat.types';
import type { Rarity } from '@/types/common.types';
import type { LootRule } from '@/types/loot.types';
import { randomInRange } from '@/utils/utils';

const COMPENSATION_CHANCE = 0.66 as const;

// в будущем можно добавить поле compensation в темплейты оружия и брони
const SCRAP_COMPENSATION_MIN = 4;
const SCRAP_COMPENSATION_MAX = 6;

const SCRAP_ID = 'scrap';
const MONEY_ID = 'coins';

type EquipmentBuckets = {
  weapons: LootItem[];
  armors: LootItem[];
  gadgets: LootItem[];
  compensation: LootItem[];
};

const SLOT_BUCKET: Record<keyof CombatEquipment, keyof EquipmentBuckets> = {
  meleePrimary: 'weapons',
  meleeSecondary: 'weapons',
  rangePrimary: 'weapons',
  rangeSecondary: 'weapons',
  armor: 'armors',
  gadget: 'gadgets',
};

function getBaseLevel(templateId: string): number {
  return ENEMY_TEMPLATES_DB[templateId].baseLevel;
}

function sampleCount(count: number | [number, number], quantityMultiplier: number): number {
  if (typeof count === 'number') {
    return Math.max(0, Math.floor(count * quantityMultiplier));
  }
  const [min, max] = count;
  const roll = randomInRange(min, max);
  return Math.max(0, Math.floor(roll * quantityMultiplier));
}

// --- 1. Агрегатор лута ---
// (Чтобы 'scrap' (x5) и 'scrap' (x3) стали 'scrap' (x8))
function aggregateLoot(lootList: LootItem[]): LootItem[] {
  const aggregated: Record<string, LootItem> = {};

  for (const item of lootList) {
    // Ключ = item.id + (возможно, rarity, если это экипировка)
    const key = `${item.id}_${item.rarity || 'default'}`;

    if (aggregated[key]) {
      aggregated[key].quantity += item.quantity;
    } else {
      aggregated[key] = { ...item };
    }
  }
  return Object.values(aggregated);
}

// хелпер: прокрутить набор правил и накидать результаты в массив
function rollRules(
  rules: Array<{ itemId: string; count: number | [number, number]; chance: number }>,
  quantityMultiplier: number,
): LootItem[] {
  const out: LootItem[] = [];
  for (const rule of rules) {
    if (Math.random() <= rule.chance) {
      const quantity = sampleCount(rule.count, quantityMultiplier);
      if (quantity > 0) out.push({ id: rule.itemId, quantity });
    }
  }
  return out;
}

// --- 2. Обработчик таблицы лута (Base + Rarity) ---
function processLootTable(enemy: CombatUnit, lootRule: LootRule): LootItem[] {
  const enemyRarity: Rarity = enemy.rarity || 'common';

  const baseLevel = getBaseLevel(enemy.templateId);
  const levelTier = Math.max(0, enemy.level - baseLevel);
  const quantityMultiplier = LEVEL_BONUS[Math.min(levelTier, LEVEL_BONUS.length - 1)] ?? 1;

  const results: LootItem[] = [];

  // rarity bonuses
  const rarityIndex = RARITY_ORDER.indexOf(enemyRarity);
  if (rarityIndex >= 0) {
    const tiersToProcess = lootRule.cascade
      ? RARITY_ORDER.slice(0, rarityIndex + 1)
      : [enemyRarity];

    for (const tier of tiersToProcess) {
      const bonusRules = lootRule.tiers[tier] ?? [];
      results.push(...rollRules(bonusRules, quantityMultiplier));
    }
  }

  return results;
}

function checkEquipmentDrop(equipment: CombatEquipment): EquipmentBuckets {
  const buckets: EquipmentBuckets = { weapons: [], armors: [], gadgets: [], compensation: [] };

  for (const slotKey of Object.keys(equipment) as Array<keyof CombatEquipment>) {
    const item = equipment[slotKey];
    if (!item) continue;

    const templateDropRate =
      WEAPON_TEMPLATES_DB[item.templateId]?.dropRate ??
      ARMOR_TEMPLATES_DB[item.templateId]?.dropRate ??
      0;

    if (templateDropRate <= 0) continue;

    if (Math.random() <= templateDropRate) {
      const bucket = SLOT_BUCKET[slotKey];
      (buckets[bucket] as LootItem[]).push({
        id: item.templateId,
        quantity: 1,
        rarity: item.rarity || 'common',
      });
    } else if (Math.random() <= COMPENSATION_CHANCE) {
      buckets.compensation.push({
        id: SCRAP_ID,
        quantity: randomInRange(SCRAP_COMPENSATION_MIN, SCRAP_COMPENSATION_MAX),
      });
    }
  }

  return buckets;
}

export const generateLoot = (enemies: CombatUnit[]): AggregatedLootResult => {
  const lootBin: AggregatedLootResult = {
    weapons: [],
    armors: [],
    gadgets: [],
    items: [],
    money: [],
    scrap: [],
  };

  for (const enemy of enemies) {
    if (enemy.status !== 'dead' && enemy.status !== 'unconscious') continue;

    // эквип (сразу по корзинам)
    const eq = checkEquipmentDrop(enemy.equipment);
    lootBin.weapons.push(...eq.weapons);
    lootBin.armors.push(...eq.armors);
    lootBin.gadgets.push(...eq.gadgets);
    lootBin.scrap.push(...eq.compensation);

    // таблица
    const lootRule = LOOT_RULES_BY_TEMPLATE[enemy.templateId];
    if (lootRule) {
      const tableLoot = processLootTable(enemy, lootRule);
      for (const item of tableLoot) {
        if (item.id === SCRAP_ID) lootBin.scrap.push(item);
        else if (item.id === MONEY_ID) lootBin.money.push(item);
        else lootBin.items.push(item);
      }
    }
  }

  return {
    weapons: aggregateLoot(lootBin.weapons),
    armors: aggregateLoot(lootBin.armors),
    gadgets: aggregateLoot(lootBin.gadgets),
    items: aggregateLoot(lootBin.items),
    money: aggregateLoot(lootBin.money),
    scrap: aggregateLoot(lootBin.scrap),
  };
};
