import { useState } from 'react';

// Импорт иконок как React-компонентов (Vite SVGR plugin)
import ArmorIcon from '@/assets/icons/armor.svg?react';
import GadgetIcon from '@/assets/icons/gadget.svg?react';
import MeleeIcon from '@/assets/icons/meleeWeapon.svg?react';
import RangeIcon from '@/assets/icons/rangeWeapon.svg?react';
import type { Rarity } from '@/types/common.types';
import type { ItemType } from '@/types/inventory.types';

import { InventoryGrid } from '../InventoryGrid/InventoryGrid';

import './InventoryPanel.scss';

interface InventoryPanelProps {
  activeTab: ItemType;
  characterId: string; // <-- Добавили проп
  onTabChange: (tab: ItemType) => void;
}

// Конфигурация табов
const TABS_CONFIG: {
  type: ItemType;
  Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}[] = [
  { type: 'meleeWeapon', Icon: MeleeIcon },
  { type: 'rangeWeapon', Icon: RangeIcon },
  { type: 'armor', Icon: ArmorIcon },
  { type: 'gadget', Icon: GadgetIcon },
];

const ALL_RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'unique'];

export const InventoryPanel = ({ activeTab, onTabChange, characterId }: InventoryPanelProps) => {
  // Локальный стейт фильтров. По умолчанию выбраны все.
  const [selectedRarities, setSelectedRarities] = useState<Set<Rarity>>(new Set(ALL_RARITIES));

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
      {/* --- ВЕРХ: ТАБЫ --- */}
      <div className="tabsHeader">
        {TABS_CONFIG.map(({ type, Icon }) => (
          <button
            key={type}
            onClick={() => onTabChange(type)}
            className={`tabButton ${activeTab === type ? 'active' : ''}`}
            title={type} // Тултип при наведении
          >
            <Icon className="tabIcon" />
          </button>
        ))}
      </div>

      {/* --- ЦЕНТР: СЕТКА --- */}
      <div className="gridContainer">
        <InventoryGrid
          activeTab={activeTab}
          characterId={characterId}
          rarityFilters={Array.from(selectedRarities)}
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
