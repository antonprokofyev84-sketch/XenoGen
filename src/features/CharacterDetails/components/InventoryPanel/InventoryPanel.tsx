import type { ItemType } from '@/types/inventory.types';

import './InventoryPanel.scss';

interface InventoryPanelProps {
  activeTab: ItemType;
  onTabChange: (tab: ItemType) => void;
}

export const InventoryPanel = ({ activeTab, onTabChange }: InventoryPanelProps) => {
  return (
    <div className="inventoryPanel">
      <h3>InventoryPanel</h3>
      <p>Current Tab: {activeTab}</p>

      <div className="tabsContainer">
        {(
          ['meleeWeapon', 'rangeWeapon', 'armor', 'gadget', 'consumable', 'misc'] as ItemType[]
        ).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={activeTab === tab ? 'btn btn-solid btn-blue' : 'btn btn-ghost'}
            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Здесь будет InventoryGrid */}
    </div>
  );
};
