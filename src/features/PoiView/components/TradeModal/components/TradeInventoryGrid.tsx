import type { ReactNode } from 'react';

import { ItemIcon } from '@/components/ItemIcon/ItemIcon';
import type { Rarity } from '@/types/common.types';
import type { InventoryItem } from '@/types/inventory.types';

import './TradeInventoryGrid.scss';

interface TradeInventoryGridProps {
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
  onItemAltClick?: (item: InventoryItem, element: HTMLElement) => void;
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
  onItemAltClick,
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
            onClick={(e) => {
              if (isFullyOffered) return;
              if (e.altKey && onItemAltClick) {
                onItemAltClick(item, e.currentTarget);
              } else {
                onItemClick(item);
              }
            }}
          >
            <ItemIcon
              templateId={item.templateId}
              type={item.type}
              rarity={item.rarity}
              quantity={remainingQty}
            >
              {isFullyOffered && <div className="offeredOverlay" />}
              {renderOverlay?.(item)}
            </ItemIcon>
          </div>
        );
      })}
    </div>
  );
};
