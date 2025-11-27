import { useMemo } from 'react';

import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';

import { inventorySelectors } from '@/state/gameSlices/inventory';
import { useGameState } from '@/state/useGameState';
import type { Rarity } from '@/types/common.types';
import type { ItemType } from '@/types/inventory.types';
import { assetsVersion } from '@/utils/assetsVersion';

import { ItemPopup } from '../ItemPopup/ItemPopup';

import './InventoryGrid.scss';

interface InventoryGridProps {
  activeTab: ItemType;
  characterId: string;
  rarityFilters: Rarity[];
}

export const InventoryGrid = ({ activeTab, characterId, rarityFilters }: InventoryGridProps) => {
  // --- STATE ---
  const items = useGameState(inventorySelectors.selectItemsByType(activeTab));
  const selectedItem = useGameState((s) => s.inventory.selectedItem);
  const selectItemAction = useGameState((s) => s.inventory.actions.selectItem);

  // --- FLOATING UI ---
  const { refs, floatingStyles } = useFloating({
    placement: 'right-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(10), flip(), shift({ padding: 10 })],
  });

  // --- FILTERING ---
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return rarityFilters.length === 0
      ? items
      : items.filter((i) => rarityFilters.includes(i.rarity));
  }, [items, rarityFilters]);

  // --- HELPERS ---
  const isSelected = (item: any) =>
    selectedItem?.item?.templateId === item.templateId &&
    selectedItem?.item?.rarity === item.rarity;

  // --- CLICK HANDLER ---
  const handleItemClick = (item: any, el: HTMLElement) => {
    selectItemAction(item, 'inventory');
    // Передаем ссылку на ВНЕШНИЙ контейнер (inventoryItem), который не меняет размер
    refs.setReference(el);
  };

  return (
    <>
      <div className="inventoryGrid">
        {filteredItems.map((item, index) => {
          const active = isSelected(item);

          return (
            <div
              key={`${item.templateId}-${item.rarity}-${index}`}
              // Внешний контейнер: фиксированный размер, якорь для попапа
              className="inventoryItem"
              ref={active ? refs.setReference : null}
              onClick={(e) => handleItemClick(item, e.currentTarget)}
            >
              {/* Визуальный контейнер: тут рамки, фон и скейл */}
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

      {/* POPUP */}
      {selectedItem && selectedItem.context === 'inventory' && (
        <FloatingPortal>
          <ItemPopup
            ref={refs.setFloating}
            style={floatingStyles}
            activeCharacterId={characterId}
          />
        </FloatingPortal>
      )}
    </>
  );
};
