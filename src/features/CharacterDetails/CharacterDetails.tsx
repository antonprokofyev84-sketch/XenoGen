import { useState } from 'react';

import { useGameState } from '@/state/useGameState';
import type { ItemType } from '@/types/inventory.types';

import { CharacterPanel } from './components/CharacterPanel/CharacterPanel';
import { InventoryPanel } from './components/InventoryPanel/InventoryPanel';

import './CharacterDetails.scss';

export const CharacterDetails = () => {
  const leaderId = useGameState((state) => state.party.leaderId);
  const unselectItem = useGameState((state) => state.inventory.actions.unselectItem);

  const [activeCharacterId, setActiveCharacterId] = useState<string>(leaderId);
  const [activeTab, setActiveTab] = useState<ItemType>('meleeWeapon');

  // Хендлер для клика по фону (сброс выделения)
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Проверяем, был ли клик совершен по предмету инвентаря или его внутренностям.
    // Если да — ничего не делаем (выделение обрабатывается внутри InventoryGrid).
    if ((e.target as HTMLElement).closest('.inventoryItem')) {
      return;
    }

    // Если клик был не по предмету (например, по пустому месту), снимаем выделение.
    unselectItem();
  };

  return (
    // Используем onClickCapture для фазы погружения
    <div className="characterDetails" onClickCapture={handleBackgroundClick}>
      <CharacterPanel characterId={activeCharacterId} />

      <InventoryPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        characterId={activeCharacterId}
      />
    </div>
  );
};
