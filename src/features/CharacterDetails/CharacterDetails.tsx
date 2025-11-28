import { useMemo, useState } from 'react';

import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import { useShallow } from 'zustand/react/shallow';

import { partySelectors } from '@/state/gameSlices/party';
import { useGameState } from '@/state/useGameState';
import type { ItemType } from '@/types/inventory.types';

import { CharacterPanel } from './components/CharacterPanel/CharacterPanel';
import { InventoryPanel } from './components/InventoryPanel/InventoryPanel';
import { ItemPopup } from './components/ItemPopup/ItemPopup';

import './CharacterDetails.scss';

export const CharacterDetails = () => {
  const leaderId = useGameState((s) => s.party.leaderId);
  const partyIds = useGameState(useShallow((s) => partySelectors.selectAllMemberIds(s)));
  const unselectItem = useGameState((s) => s.inventory.actions.unselectItem);
  const selectedItem = useGameState((s) => s.inventory.selectedItem);

  // -----------------------------
  // ACTIVE CHARACTER LOGIC
  // -----------------------------
  const initialIndex = useMemo(() => {
    const idx = partyIds.indexOf(leaderId);
    return idx === -1 ? 0 : idx;
  }, [partyIds, leaderId]);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeCharacterId = partyIds[activeIndex] ?? leaderId;

  const switchCharacter = (direction: 1 | -1) => {
    if (partyIds.length <= 1) return;
    setActiveIndex((i) => {
      const next = (i + direction + partyIds.length) % partyIds.length;
      return next;
    });
    unselectItem();
  };

  // -----------------------------
  // ACTIVE TAB
  // -----------------------------
  const [activeTab, setActiveTab] = useState<ItemType>('meleeWeapon');

  // -----------------------------
  // FLOATING UI (POPUP)
  // -----------------------------
  const { refs, floatingStyles } = useFloating({
    placement: 'right-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(10), flip(), shift({ padding: 10 })],
  });

  // -----------------------------
  // CLICK OUTSIDE TO UNSELECT
  // -----------------------------
  const handleClickCapture = (e: React.MouseEvent) => {
    // Игнорируем клики внутри инвентаря, слотов экипировки и попапа
    const isItemClick = (e.target as HTMLElement).closest('.inventoryItem, .equipmentSlot');
    const isPopupClick = (e.target as HTMLElement).closest('.itemPopup');

    if (!isItemClick && !isPopupClick) {
      unselectItem();
      refs.setReference(null); // Сбрасываем реф
    }
  };

  return (
    <div className="characterDetails" onClickCapture={handleClickCapture}>
      <CharacterPanel
        characterId={activeCharacterId}
        showNavigation={partyIds.length > 1}
        onNext={() => switchCharacter(+1)}
        onPrev={() => switchCharacter(-1)}
        onItemRef={refs.setReference} // Передаем реф для слотов экипировки
      />

      <InventoryPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        characterId={activeCharacterId}
        onItemRef={refs.setReference} // Передаем реф для сетки инвентаря
      />

      {/* POPUP: Показываем, если есть выбранный предмет (независимо от контекста) */}
      {selectedItem && (
        <FloatingPortal>
          <ItemPopup
            ref={refs.setFloating}
            style={floatingStyles}
            activeCharacterId={activeCharacterId}
          />
        </FloatingPortal>
      )}
    </div>
  );
};
