import { useState } from 'react';

import { useGameState } from '@/state/useGameState';
import type { ItemType } from '@/types/inventory.types';

import { CharacterPanel } from './components/CharacterPanel/CharacterPanel';
import { InventoryPanel } from './components/InventoryPanel/InventoryPanel';
import { ItemDetails } from './components/ItemDetails/ItemDetails';

import './CharacterDetails.scss';

// --- ОСНОВНОЙ КОМПОНЕНТ ---

export const CharacterDetails = () => {
  // 1. Получаем ID лидера для начального стейта
  const leaderId = useGameState((state) => state.party.leaderId);

  // 2. Локальный стейт экрана
  const [activeCharacterId, setActiveCharacterId] = useState<string>(leaderId);
  const [activeTab, setActiveTab] = useState<ItemType>('meleeWeapon');

  return (
    <div className="inventoryScreen">
      {/* ЛЕВАЯ КОЛОНКА: Персонаж и слоты */}
      <div className="leftColumn">
        <CharacterPanel characterId={activeCharacterId} />
      </div>

      {/* ПРАВАЯ КОЛОНКА: Сетка предметов и Детали */}
      <div className="rightColumn">
        <div className="inventoryContainer">
          <InventoryPanel activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="detailsContainer">
          <ItemDetails />
        </div>
      </div>
    </div>
  );
};
