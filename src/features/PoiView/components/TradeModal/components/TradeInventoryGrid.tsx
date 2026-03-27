import type { ReactNode } from 'react';

import type { Rarity } from '@/types/common.types';
import type { InventoryItem } from '@/types/inventory.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './TradeInventoryGrid.scss';

interface TradeInventoryGridProps {
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
  /** Items currently in the trade offer — shown dimmed in the main grid */
  offeredItems?: { templateId: string; rarity: Rarity; quantity: number }[];
  /** Optional overlay rendered on top of each item card (e.g. price badge) */
  renderOverlay?: (item: InventoryItem) => ReactNode;
  /** Compact mode for offer areas (smaller cells) */
  compact?: boolean;
}

export const TradeInventoryGrid = ({
  items,
  onItemClick,
  offeredItems,
  renderOverlay,
  compact,
}: TradeInventoryGridProps) => {
  const getOfferedQty = (item: InventoryItem): number => {
    if (!offeredItems) return 0;
    const match = offeredItems.find(
      (o) => o.templateId === item.templateId && o.rarity === item.rarity,
    );
    return match?.quantity ?? 0;
  };

  return (
    <div className={`tradeInventoryGrid ${compact ? 'compact' : ''}`}>
      {items.map((item, index) => {
        const offeredQty = getOfferedQty(item);
        const remainingQty = item.quantity - offeredQty;
        const isFullyOffered = remainingQty <= 0;

        return (
          <div
            key={`${item.templateId}-${item.rarity}-${index}`}
            className={`tradeItem ${isFullyOffered ? 'offered' : ''}`}
            onClick={() => !isFullyOffered && onItemClick(item)}
          >
            <div className={`iconContainer ${item.rarity}`}>
              <img
                src={assetsVersion(`/images/${item.type}/${item.templateId}.png`)}
                alt=""
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.visibility = 'hidden';
                }}
              />
              {remainingQty > 1 && <span className="itemQuantity">x{remainingQty}</span>}
              {isFullyOffered && <div className="offeredOverlay" />}
              {renderOverlay?.(item)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
