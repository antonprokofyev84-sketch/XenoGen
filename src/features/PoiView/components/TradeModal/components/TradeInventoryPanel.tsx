import { useMemo, useState } from 'react';

import ArmorIcon from '@/assets/icons/armor.svg?react';
import GadgetIcon from '@/assets/icons/gadget.svg?react';
import MeleeIcon from '@/assets/icons/meleeWeapon.svg?react';
import RangeIcon from '@/assets/icons/rangeWeapon.svg?react';
import { filterItemsByType } from '@/state/gameSlices/inventory';
import type { Rarity } from '@/types/common.types';
import type { InventoryItem, ItemTypeFilter } from '@/types/inventory.types';
import type { TradeOfferItem } from '@/types/trade.types';

import { TradeInventoryGrid } from './TradeInventoryGrid';

import './TradeInventoryPanel.scss';

interface TabConfig {
  key: string;
  filter: ItemTypeFilter;
  Icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  text?: string;
}

interface TradeInventoryPanelProps {
  title: string;
  items: InventoryItem[];
  money: number;
  offerItems: TradeOfferItem[];
  getItemPrice: (item: InventoryItem) => number;
  onItemClick: (item: InventoryItem) => void;
}

const TABS_CONFIG: TabConfig[] = [
  { key: 'meleeWeapon', filter: ['meleeWeapon'], Icon: MeleeIcon },
  { key: 'rangeWeapon', filter: ['rangeWeapon'], Icon: RangeIcon },
  { key: 'armor', filter: ['armor'], Icon: ArmorIcon },
  { key: 'gadget', filter: ['gadget'], Icon: GadgetIcon },
];

const EXTRA_TAB_TYPES = ['resource', 'consumable', 'misc'] as const;
const ALL_RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'unique'];

export const TradeInventoryPanel = ({
  title,
  items,
  money,
  offerItems,
  getItemPrice,
  onItemClick,
}: TradeInventoryPanelProps) => {
  const [activeTabKey, setActiveTabKey] = useState('meleeWeapon');
  const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set(ALL_RARITIES));

  const toggleRarity = (rarity: Rarity) => {
    const next = new Set(selectedRarities);
    if (next.has(rarity)) next.delete(rarity);
    else next.add(rarity);
    setSelectedRarities(next);
  };

  const activeFilter: ItemTypeFilter = useMemo(() => {
    const tab = TABS_CONFIG.find((t) => t.key === activeTabKey);
    if (tab) return tab.filter;
    // Extra tab — activeTabKey is the type itself
    return [activeTabKey as InventoryItem['type']];
  }, [activeTabKey]);

  const filteredItems = useMemo(() => {
    const byType = filterItemsByType(items, activeFilter);
    if (selectedRarities.size === 0) return byType;
    return byType.filter((i) => selectedRarities.has(i.rarity));
  }, [items, activeFilter, selectedRarities]);

  const offeredForGrid = useMemo(
    () =>
      offerItems.map((o) => ({
        templateId: o.templateId,
        rarity: o.rarity,
        quantity: o.quantity,
      })),
    [offerItems],
  );

  const visibleExtraTabs = useMemo(
    () => EXTRA_TAB_TYPES.filter((type) => items.some((i) => i.type === type)),
    [items],
  );

  return (
    <div className="tradeInventoryPanel">
      {/* Header */}
      <div className="panelHeader">
        <span className="panelTitle">{title}</span>
        <span className="panelMoney">${money}</span>
      </div>

      {/* Tabs */}
      <div className="panelTabs">
        {TABS_CONFIG.map(({ key, Icon, text }) => (
          <button
            key={key}
            onClick={() => setActiveTabKey(key)}
            className={`tabButton ${activeTabKey === key ? 'active' : ''}`}
            title={key}
          >
            {Icon ? <Icon className="tabIcon" /> : <span>{text}</span>}
          </button>
        ))}
        {visibleExtraTabs.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTabKey(type)}
            className={`tabButton text ${activeTabKey === type ? 'active' : ''}`}
            title={type}
          >
            {type.slice(0, 3).toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="panelGrid">
        <TradeInventoryGrid
          items={filteredItems}
          onItemClick={onItemClick}
          offeredItems={offeredForGrid}
          renderOverlay={(item) => {
            const price = getItemPrice(item);
            return <span className="priceTag">${price}</span>;
          }}
        />
      </div>

      {/* Rarity filters */}
      <div className="panelFilters">
        {ALL_RARITIES.map((rarity) => (
          <label key={rarity} className={`rarityCheckbox ${rarity}`}>
            <input
              type="checkbox"
              checked={selectedRarities.has(rarity)}
              onChange={() => toggleRarity(rarity)}
            />
            <span className="checkmark" />
            <span className="labelName">{rarity}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
