import { useMemo } from 'react';

import { inventorySelectors } from '@/state/gameSlices/inventory';
import { useGameState } from '@/state/useGameState';
import type { Rarity } from '@/types/common.types';
import type { ItemType } from '@/types/inventory.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './InventoryGrid.scss';

interface InventoryGridProps {
  activeTab: ItemType;
  characterId: string;
  rarityFilters: Rarity[];
  onItemRef: (el: HTMLElement | null) => void; // <-- Колбек для передачи рефа родителю
}

export const InventoryGrid = ({
  activeTab,
  characterId,
  rarityFilters,
  onItemRef,
}: InventoryGridProps) => {
  // --- STATE ---
  const items = useGameState(inventorySelectors.selectItemsByType(activeTab));
  const selectedItem = useGameState((s) => s.inventory.selectedItem);
  const selectItemAction = useGameState((s) => s.inventory.actions.selectItem);

  // --- FILTERING ---
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return rarityFilters.length === 0
      ? items
      : items.filter((i) => rarityFilters.includes(i.rarity));
  }, [items, rarityFilters]);

  // --- HELPERS ---
  const isSelected = (item: any) =>
    selectedItem?.context === 'inventory' &&
    selectedItem?.item?.templateId === item.templateId &&
    selectedItem?.item?.rarity === item.rarity;

  // --- CLICK HANDLER ---
  const handleItemClick = (item: any) => {
    selectItemAction(item, 'inventory');
    // onItemRef не нужен здесь, так как ref сработает автоматически при ререндере
    // благодаря условию ref={active ? onItemRef : null} ниже
  };

  return (
    <div className="inventoryGrid">
      {filteredItems.map((item, index) => {
        const active = isSelected(item);

        return (
          <div
            key={`${item.templateId}-${item.rarity}-${index}`}
            className={`inventoryItem ${active ? 'active' : ''}`}
            // Если элемент активен, React вызывает onItemRef с этим DOM-элементом.
            // Родитель (InventoryScreen) получает этот элемент и привязывает к нему попап.
            ref={active ? onItemRef : null}
            onClick={() => handleItemClick(item)}
          >
            {/* Визуальный контейнер */}
            <div className={`iconContainer ${item.rarity} ${active ? 'active' : ''}`}>
              <img
                src={assetsVersion(`/images/${activeTab}/${item.templateId}.png`)}
                alt=""
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.visibility = 'hidden';
                }}
              />
              {item.quantity > 1 && <span className="itemQuantity">x{item.quantity}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};
