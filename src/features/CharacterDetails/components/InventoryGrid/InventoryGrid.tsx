import { useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { ItemIcon } from '@/components/ItemIcon/ItemIcon';
import { inventorySelectors } from '@/state/gameSlices/inventory';
import { useGameState } from '@/state/useGameState';
import type { Rarity } from '@/types/common.types';
import type { InventoryItem, ItemTypeFilter } from '@/types/inventory.types';

import './InventoryGrid.scss';

interface InventoryGridProps {
  typeFilter: ItemTypeFilter;
  characterId: string;
  rarityFilters: Rarity[];
  onItemRef: (el: HTMLElement | null) => void;
}

export const InventoryGrid = ({
  typeFilter,
  characterId,
  rarityFilters,
  onItemRef,
}: InventoryGridProps) => {
  // --- STATE ---
  const items = useGameState(useShallow(inventorySelectors.selectPlayerItemsByFilter(typeFilter)));
  const selectedItem = useGameState((s) => s.inventory.selectedItem);
  const selectItemAction = useGameState((s) => s.inventory.actions.selectItem);

  // --- FILTERING ---
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return rarityFilters.length === 0
      ? items
      : items.filter((i: InventoryItem) => rarityFilters.includes(i.rarity));
  }, [items, rarityFilters]);

  // --- HELPERS ---
  const isSelected = (item: any) =>
    selectedItem?.context === 'inventory' &&
    selectedItem?.item?.templateId === item.templateId &&
    selectedItem?.item?.rarity === item.rarity;

  // --- CLICK HANDLER ---
  const handleItemClick = (item: any) => {
    selectItemAction(characterId, item, 'inventory');
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
            <ItemIcon
              templateId={item.templateId}
              type={item.type}
              rarity={item.rarity}
              quantity={item.quantity}
              className={active ? 'active' : ''}
            />
          </div>
        );
      })}
    </div>
  );
};
