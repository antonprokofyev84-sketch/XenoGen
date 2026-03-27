import type { TradeOfferItem } from '@/types/trade.types';
import { assetsVersion } from '@/utils/assetsVersion';

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
}: TradeOfferAreaProps) => {
  return (
    <div className="tradeOfferArea">
      <div className="offerHeader">
        <span className="offerTitle">{title}</span>
        <span className="offerTotal">${totalValue}</span>
      </div>

      <div className="offerContent">
        <div className="offerItems">
          {items.map((item, index) => (
            <div
              key={`${item.templateId}-${item.rarity}-${index}`}
              className="offerItem"
              onClick={() => onRemoveItem(item)}
              title={`${item.templateId} — $${getItemPrice(item)} each (click to remove)`}
            >
              <div className={`offerItemIcon ${item.rarity}`}>
                <img
                  src={assetsVersion(`/images/${item.type}/${item.templateId}.png`)}
                  alt=""
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.visibility = 'hidden';
                  }}
                />
                {item.quantity > 1 && <span className="offerQty">x{item.quantity}</span>}
              </div>
              <span className="offerPrice">${getItemPrice(item) * item.quantity}</span>
            </div>
          ))}
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
              {/* TODO тут нужно сделать не макс а типа уравновесить сделку */}
              <button
                className="moneyBtn"
                onClick={() => onMoneyChange?.(maxMoney)}
                title="Offer all money"
              >
                Max
              </button>
              <button
                className="moneyBtn"
                onClick={() => onMoneyChange?.(0)}
                title="Remove money from offer"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
