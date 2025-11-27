import { RARITY_ORDER } from '@/constants';
import { ENEMY_TEMPLATES_DB } from '@/data/enemy.templates';
import { ITEMS_TEMPLATES_DB } from '@/data/items.templates';
import { LEVEL_BONUS, LOOT_RULES_BY_TEMPLATE } from '@/data/loot.rules';
import type { CombatUnit } from '@/types/combat.types';
import type { Rarity } from '@/types/common.types';
import type { CombatLoot, InventoryItem, ItemType } from '@/types/inventory.types';
import type { LootEntry, LootRule } from '@/types/loot.types';
import { randomInRange } from '@/utils/utils';

type SlotItemMinimal = { templateId: string; rarity: Rarity; type: ItemType };

// --- КОНСТАНТЫ ---
const COMPENSATION_CHANCE = 0.66 as const;
const SCRAP_COMPENSATION_MIN = 4;
const SCRAP_COMPENSATION_MAX = 6;

// --- ХЕЛПЕРЫ ---

function getBaseLevel(templateId: string): number {
  return ENEMY_TEMPLATES_DB[templateId]?.baseLevel ?? 1;
}

function sampleCount(quantity: number | [number, number], quantityMultiplier: number): number {
  if (typeof quantity === 'number') {
    return Math.max(0, Math.floor(quantity * quantityMultiplier));
  }
  const [min, max] = quantity;
  const roll = randomInRange(min, max);
  return Math.max(0, Math.floor(roll * quantityMultiplier));
}

/**
 * Добавляет предмет в хранилище с учетом агрегации (стакания).
 */
function addItemToLoot(storage: InventoryItem[], item: InventoryItem) {
  const { templateId, rarity, quantity } = item;

  const existingItem = storage.find((i) => i.templateId === templateId && i.rarity === rarity);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    storage.push({ ...item });
  }
}

// --- ЛОГИКА ГЕНЕРАЦИИ ---

type SimpleLootResult = { id: string; quantity: number; type: string };

function rollRules(rules: Array<LootEntry>, quantityMultiplier: number): SimpleLootResult[] {
  const out: SimpleLootResult[] = [];
  for (const rule of rules) {
    if (Math.random() <= rule.chance) {
      const quantity = sampleCount(rule.quantity, quantityMultiplier);
      if (quantity > 0)
        out.push({
          id: rule.itemId,
          quantity,
          type: ITEMS_TEMPLATES_DB[rule.itemId]?.type || 'misc',
        });
    }
  }
  return out;
}

function processLootTable(enemy: CombatUnit, lootRule: LootRule): SimpleLootResult[] {
  const enemyRarity: Rarity = enemy.rarity || 'common';
  const baseLevel = getBaseLevel(enemy.templateId);
  const levelTier = Math.max(0, enemy.level - baseLevel);
  const quantityMultiplier = LEVEL_BONUS[Math.min(levelTier, LEVEL_BONUS.length - 1)] ?? 1;

  const results: SimpleLootResult[] = [];
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

// --- ГЛАВНАЯ ФУНКЦИЯ ---

export const generateLoot = (enemies: CombatUnit[]): CombatLoot => {
  const itemsStorage: InventoryItem[] = [];

  const resources = {
    money: 0,
    scrap: 0,
    food: 0,
  };

  for (const enemy of enemies) {
    if (enemy.status !== 'dead' && enemy.status !== 'unconscious') continue;

    const processEquipmentSlot = (slotItem: SlotItemMinimal | null | undefined) => {
      if (!slotItem) return;

      const dropRate = ITEMS_TEMPLATES_DB[slotItem.templateId]?.dropRate ?? 0;

      if (dropRate > 0) {
        if (Math.random() <= dropRate) {
          addItemToLoot(itemsStorage, {
            templateId: slotItem.templateId,
            type: slotItem.type,
            rarity: slotItem.rarity,
            quantity: 1,
          });
        } else if (Math.random() <= COMPENSATION_CHANCE) {
          resources.scrap += randomInRange(SCRAP_COMPENSATION_MIN, SCRAP_COMPENSATION_MAX);
        }
      }
    };

    if (enemy.equipment) {
      processEquipmentSlot(enemy.equipment.meleePrimary);
      processEquipmentSlot(enemy.equipment.meleeSecondary);
      processEquipmentSlot(enemy.equipment.rangePrimary);
      processEquipmentSlot(enemy.equipment.rangeSecondary);
      processEquipmentSlot(enemy.equipment.armor);
      processEquipmentSlot(enemy.equipment.gadget);
    }

    const lootRule = LOOT_RULES_BY_TEMPLATE[enemy.templateId];
    if (lootRule) {
      const tableLoot = processLootTable(enemy, lootRule);

      for (const lootItem of tableLoot) {
        if (lootItem.type === 'resource') {
          resources[lootItem.id as keyof typeof resources] += lootItem.quantity;
          continue;
        }

        addItemToLoot(itemsStorage, {
          templateId: lootItem.id,
          type: lootItem.type as ItemType,
          rarity: 'common',
          quantity: lootItem.quantity,
        });
      }
    }
  }

  return {
    items: itemsStorage,
    resources,
  };
};
