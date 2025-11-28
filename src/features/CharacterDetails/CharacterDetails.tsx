import { useMemo, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { partySelectors } from '@/state/gameSlices/party';
import { useGameState } from '@/state/useGameState';
import type { ItemType } from '@/types/inventory.types';

import { CharacterPanel } from './components/CharacterPanel/CharacterPanel';
import { InventoryPanel } from './components/InventoryPanel/InventoryPanel';

import './CharacterDetails.scss';

export const CharacterDetails = () => {
  const leaderId = useGameState((s) => s.party.leaderId);
  const partyIds = useGameState(useShallow((s) => partySelectors.selectAllMemberIds(s)));
  const unselectItem = useGameState((s) => s.inventory.actions.unselectItem);

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

  const [activeTab, setActiveTab] = useState<ItemType>('meleeWeapon');

  const handleClickCapture = (e: React.MouseEvent) => {
    const isItemClick = (e.target as HTMLElement).closest('.inventoryItem');
    if (!isItemClick) unselectItem();
  };

  return (
    <div className="characterDetails" onClickCapture={handleClickCapture}>
      <CharacterPanel
        characterId={activeCharacterId}
        showNavigation={partyIds.length > 1}
        onNext={() => switchCharacter(+1)}
        onPrev={() => switchCharacter(-1)}
      />

      <InventoryPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        characterId={activeCharacterId}
      />
    </div>
  );
};
