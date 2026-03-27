import type { InventoryItem } from '@/types/inventory.types';

/** A single item added to a trade offer (may be partial quantity) */
export interface TradeOfferItem {
  templateId: string;
  type: InventoryItem['type'];
  rarity: InventoryItem['rarity'];
  quantity: number;
}

/** One side's trade offer */
export interface TradeOffer {
  items: TradeOfferItem[];
  money: number;
}

/** Trade evaluation result shown in the summary bar */
export type TradeBalance = 'favorable' | 'fair' | 'unfavorable';
