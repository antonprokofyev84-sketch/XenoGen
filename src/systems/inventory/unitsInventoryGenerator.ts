import { RARITY_ORDER } from '@/constants';
import { ENEMY_TEMPLATES_DB } from '@/data/enemy.templates';
import { ITEMS_TEMPLATES_DB } from '@/data/items.templates';
import { LEVEL_BONUS, LOOT_RULES_BY_TEMPLATE } from '@/data/loot.rules';
import type { CombatUnit } from '@/types/combat.types';
import type { Rarity } from '@/types/common.types';
import type { InventoryContainer, InventoryItem, ItemType } from '@/types/inventory.types';
import type { LootEntry, LootRule } from '@/types/loot.types';
import { randomInRange } from '@/utils/utils';

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

function addItemToLoot(storage: InventoryItem[], item: InventoryItem) {
  const { templateId, rarity, quantity } = item;

  const existingItem = storage.find((i) => i.templateId === templateId && i.rarity === rarity);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    storage.push({ ...item });
  }
}

type SimpleLootResult = { id: string; quantity: number; type: ItemType };

function rollRules(rules: Array<LootEntry>, quantityMultiplier: number): SimpleLootResult[] {
  const out: SimpleLootResult[] = [];
  for (const rule of rules) {
    if (Math.random() <= rule.chance) {
      const quantity = sampleCount(rule.quantity, quantityMultiplier);
      if (quantity > 0)
        out.push({
          id: rule.itemId,
          quantity,
          type: (ITEMS_TEMPLATES_DB[rule.itemId]?.type as ItemType) || 'misc',
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

export const generatetUnitsInventory = (combatUnits: CombatUnit[]): InventoryContainer => {
  const container: InventoryContainer = {
    items: [],
    money: 0,
  };

  for (const combatUnit of combatUnits) {
    const lootRule = LOOT_RULES_BY_TEMPLATE[combatUnit.templateId];
    if (!lootRule) continue;

    const tableLoot = processLootTable(combatUnit, lootRule);

    for (const lootItem of tableLoot) {
      if (lootItem.id === 'money') {
        container.money += lootItem.quantity;
        continue;
      }

      addItemToLoot(container.items, {
        templateId: lootItem.id,
        type: lootItem.type,
        rarity: 'common',
        quantity: lootItem.quantity,
      });
    }
  }

  return container;
};
