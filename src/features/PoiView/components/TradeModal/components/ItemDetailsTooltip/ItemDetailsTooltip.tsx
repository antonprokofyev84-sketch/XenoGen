import { forwardRef, useMemo } from 'react';

import MoneyIcon from '@/assets/icons/money.svg?react';
import textData from '@/locales/en.json';
import { buildItemDetails } from '@/systems/items/itemDetailsBuilder';
import type { InventoryItem } from '@/types/inventory.types';

import './ItemDetailsTooltip.scss';

interface ItemDetailsTooltipProps {
  item: InventoryItem;
  style?: React.CSSProperties;
}

const getRarityLabel = (rarity: string) => {
  const rarityDict = textData.rarity as Record<string, string> | undefined;
  return rarityDict?.[rarity] || rarity;
};

export const ItemDetailsTooltip = forwardRef<HTMLDivElement, ItemDetailsTooltipProps>(
  ({ item, style }, ref) => {
    const rarity = item.rarity || 'common';

    const itemLocale = (textData.items as Record<string, { name: string }>)[item.templateId];
    const name = itemLocale?.name || item.templateId;
    const rarityLabel = getRarityLabel(rarity);

    const details = useMemo(() => buildItemDetails(item), [item]);

    if (!details) return null;

    return (
      <div ref={ref} style={style} className={`itemDetailsTooltip ${rarity}`}>
        {/* HEADER */}
        <div className={`tooltipHeader ${rarity}`}>
          <div className="titleRow">
            <span className="itemName">{name}</span>
            <span className="rarityLabel">{rarityLabel}</span>
          </div>
          {details.price > 0 && (
            <div className="priceRow">
              <span className="priceValue">{details.price}</span> <MoneyIcon className="icon" />
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="tooltipBody">
          {/* REQUIREMENTS (no met/unmet styling — trade is party-wide) */}
          {details.requirementRows.length > 0 && (
            <div className="section requirements">
              <div className="sectionTitle">Requires</div>
              <div className="reqGrid">
                {details.requirementRows.map((req, idx) => (
                  <span key={idx} className="reqItem">
                    {req.label} {req.value}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* BASE STATS */}
          {details.baseRows.length > 0 && (
            <div className="section baseStats">
              {details.baseRows.map((row, idx) => (
                <div key={idx} className="statRow">
                  <span className="label">{row.label}</span>
                  <span className="value highlight">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* MODS */}
          {details.modRows.length > 0 && (
            <div className="section mods">
              {details.modRows.map((row, idx) => (
                <div key={idx} className="statRow">
                  <span className="label">{row.label}</span>
                  <span className={`value ${row.highlight || ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* DESCRIPTION */}
          {details.description && <div className="section description">{details.description}</div>}
        </div>
      </div>
    );
  },
);
