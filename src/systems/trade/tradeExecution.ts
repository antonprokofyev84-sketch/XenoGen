import { ITEMS_TEMPLATES_DB } from '@/data/items.templates';
import { equipmentFactory } from '@/systems/equipment/equipmentFactory';
import type { InventoryItem } from '@/types/inventory.types';
import type { TradeOffer, TradeOfferItem } from '@/types/trade.types';

// TODO возможно нужно создать вспомогательные методы для получения цены итема с учетом редкости, а не дублировать логику из equipmentFactory в tradeExecution
/**
 * Resolve the base price for an inventory item (accounts for rarity multipliers).
 */
export function getItemBasePrice(item: InventoryItem | TradeOfferItem): number {
  const template = ITEMS_TEMPLATES_DB[item.templateId];
  if (!template) return 0;

  if (item.type === 'meleeWeapon' || item.type === 'rangeWeapon') {
    const instance = equipmentFactory.createWeaponInstance(item.templateId, item.rarity);
    return instance ? Math.round(instance.price ?? 0) : Math.round(template.price ?? 0);
  }

  if (item.type === 'armor') {
    const instance = equipmentFactory.createArmorInstance(item.templateId, item.rarity);
    return instance ? Math.round(instance.price ?? 0) : Math.round(template.price ?? 0);
  }

  return Math.round(template.price ?? 0);
}

// TODO тут пересчет каждого итема при каждом рендере — можно оптимизировать
/**
 * Calculate the total value of one side's trade offer.
 * @param multiplier — the buy or sell multiplier from tradePricing
 */
export function calculateOfferTotal(offer: TradeOffer, multiplier: number): number {
  const itemsTotal = offer.items.reduce(
    (sum, item) => sum + Math.round(getItemBasePrice(item) * multiplier) * item.quantity,
    0,
  );
  return itemsTotal + offer.money;
}

/**
 * Calculate the raw base cost of a trade offer (no multiplier applied).
 */
export function calculateTradeBaseCost(offer: TradeOffer): number {
  const itemsTotal = offer.items.reduce(
    (sum, item) => sum + getItemBasePrice(item) * item.quantity,
    0,
  );
  return itemsTotal + offer.money;
}
