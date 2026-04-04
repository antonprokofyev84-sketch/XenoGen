import { ItemIcon } from '@/components/ItemIcon/ItemIcon';
import type { TradeOfferItem } from '@/types/trade.types';

import './TradeOfferArea.scss';

interface TradeOfferAreaProps {
  title: string;
  items: TradeOfferItem[];
  money: number;
  totalValue: number;
  getItemPrice: (item: TradeOfferItem) => number;
  onRemoveItem: (item: TradeOfferItem) => void;
  onMoneyChange?: (value: number) => void;
  maxMoney?: number;
  readonlyMoney?: boolean;
  scrollLeft?: boolean;
}

export const TradeOfferArea = ({
  title,
  items,
  money,
  totalValue,
  getItemPrice,
  onRemoveItem,
  onMoneyChange,
  maxMoney = 0,
  readonlyMoney,
  scrollLeft,
}: TradeOfferAreaProps) => {
  return (
    <div className={`tradeOfferArea ${scrollLeft ? 'scrollLeft' : ''}`}>
      <div className="offerHeader">
        <span className="offerTitle">{title}</span>
        <span className="offerTotal">${totalValue}</span>
      </div>
      <div className="offerMoney">
        <span className="moneyLabel">$</span>
        {readonlyMoney ? (
          <span className="moneyValue">{money}</span>
        ) : (
          <div className="moneyControls">
            <input
              type="number"
              min={0}
              max={maxMoney}
              value={money}
              onChange={(e) => {
                const val = Math.max(0, Math.min(maxMoney, Number(e.target.value) || 0));
                onMoneyChange?.(val);
              }}
            />
            <button
              className="moneyBtn"
              onClick={() => onMoneyChange?.(Math.min(maxMoney, money + 100))}
              title="Add 100"
            >
              +100
            </button>
            <button
              className="moneyBtn"
              onClick={() => onMoneyChange?.(Math.max(0, money - 100))}
              title="Remove 100"
            >
              −100
            </button>
          </div>
        )}
      </div>

      <div className="offerContent">
        <div className="offerItemsScroll">
          <div className="offerItems">
            {items.map((item, index) => (
              <div
                key={`${item.templateId}-${item.rarity}-${index}`}
                className="offerItem"
                onClick={() => onRemoveItem(item)}
                title={`${item.templateId} — $${getItemPrice(item)} each (click to remove)`}
              >
                <ItemIcon
                  templateId={item.templateId}
                  type={item.type}
                  rarity={item.rarity}
                  quantity={item.quantity}
                  className="offerItemIcon"
                />
                <span className="offerPrice">${getItemPrice(item) * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
