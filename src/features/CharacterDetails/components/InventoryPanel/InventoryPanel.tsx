import { useState } from 'react';

import ArmorIcon from '@/assets/icons/armor.svg?react';
import GadgetIcon from '@/assets/icons/gadget.svg?react';
import MeleeIcon from '@/assets/icons/meleeWeapon.svg?react';
import RangeIcon from '@/assets/icons/rangeWeapon.svg?react';
import { useGameState } from '@/state/useGameState';
import type { Rarity } from '@/types/common.types';
import type { ItemTypeFilter } from '@/types/inventory.types';

import { InventoryGrid } from '../InventoryGrid/InventoryGrid';

import './InventoryPanel.scss';

interface TabConfig {
  key: string;
  filter: ItemTypeFilter;
  Icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  text?: string;
}

const TABS_CONFIG: TabConfig[] = [
  { key: 'all', filter: ['meleeWeapon', 'rangeWeapon', 'armor', 'gadget'], text: 'All' },
  { key: 'meleeWeapon', filter: ['meleeWeapon'], Icon: MeleeIcon },
  { key: 'rangeWeapon', filter: ['rangeWeapon'], Icon: RangeIcon },
  { key: 'armor', filter: ['armor'], Icon: ArmorIcon },
  { key: 'gadget', filter: ['gadget'], Icon: GadgetIcon },
];

const ALL_RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'unique'];

interface InventoryPanelProps {
  characterId: string;
  onItemRef: (el: HTMLElement | null) => void;
}

export const InventoryPanel = ({ characterId, onItemRef }: InventoryPanelProps) => {
  const goToScreen = useGameState((state) => state.ui.goToScreen);
  const [activeTabKey, setActiveTabKey] = useState('all');
  const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set(ALL_RARITIES));

  const activeTab = TABS_CONFIG.find((t) => t.key === activeTabKey) ?? TABS_CONFIG[0];

  const toggleRarity = (rarity: Rarity) => {
    const next = new Set(selectedRarities);
    if (next.has(rarity)) {
      next.delete(rarity);
    } else {
      next.add(rarity);
    }
    setSelectedRarities(next);
  };

  return (
    <div className="inventoryPanel">
      {/* --- ВЕРХ: ТАБЫ + КНОПКА ЗАКРЫТИЯ --- */}
      <div className="tabsHeader">
        <div className="tabsList">
          {TABS_CONFIG.map(({ key, Icon, text }) => (
            <button
              key={key}
              onClick={() => setActiveTabKey(key)}
              className={`tabButton ${activeTabKey === key ? 'active' : ''}`}
              title={key}
            >
              {Icon ? <Icon className="tabIcon" /> : <span className="tabText">{text}</span>}
            </button>
          ))}
        </div>

        <button
          className="closeButton"
          onClick={() => goToScreen('strategicMap')}
          title="Close Inventory"
        >
          X
        </button>
      </div>

      {/* --- ЦЕНТР: СЕТКА --- */}
      <div className="gridContainer">
        <InventoryGrid
          typeFilter={activeTab.filter}
          characterId={characterId}
          rarityFilters={Array.from(selectedRarities)}
          onItemRef={onItemRef}
        />
      </div>

      {/* --- НИЗ: ФИЛЬТРЫ --- */}
      <div className="filtersFooter">
        {ALL_RARITIES.map((rarity) => (
          <label key={rarity} className={`rarityCheckbox ${rarity}`}>
            <input
              type="checkbox"
              checked={selectedRarities.has(rarity)}
              onChange={() => toggleRarity(rarity)}
            />
            <span className="checkmark"></span>
            <span className="labelName">{rarity}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
