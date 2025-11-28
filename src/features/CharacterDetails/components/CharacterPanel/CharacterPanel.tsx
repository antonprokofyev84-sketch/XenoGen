import { useShallow } from 'zustand/react/shallow';

import ArmorIcon from '@/assets/icons/armor.svg?react';
import GadgetIcon from '@/assets/icons/gadget.svg?react';
import MeleeIcon from '@/assets/icons/meleeWeapon.svg?react';
import RangeIcon from '@/assets/icons/rangeWeapon.svg?react';
import { characterSelectors } from '@/state/gameSlices/characters';
import { equipmentSelectors } from '@/state/gameSlices/equipment';
import { useGameState } from '@/state/useGameState';
import type { EquipmentSlot } from '@/types/equipment.types';
import type { InventoryItem } from '@/types/inventory.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './CharacterPanel.scss';

interface CharacterPanelProps {
  characterId: string;
  showNavigation: boolean;
  onNext: () => void;
  onPrev: () => void;
}

const LEFT_SLOTS: { slot: EquipmentSlot; Icon: any }[] = [
  { slot: 'armor', Icon: ArmorIcon },
  { slot: 'meleePrimary', Icon: MeleeIcon },
  { slot: 'meleeSecondary', Icon: MeleeIcon },
];

const RIGHT_SLOTS: { slot: EquipmentSlot; Icon: any }[] = [
  { slot: 'gadget', Icon: GadgetIcon },
  { slot: 'rangePrimary', Icon: RangeIcon },
  { slot: 'rangeSecondary', Icon: RangeIcon },
];

const EquipmentSlotItem = ({
  slot,
  item,
  Icon,
  isSelected,
  onClick,
}: {
  slot: EquipmentSlot;
  item: InventoryItem | null | undefined;
  Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const rarity = item?.rarity || 'common';

  return (
    <div
      className={`equipmentSlot ${item ? 'filled' : 'empty'} ${isSelected ? 'active' : ''} ${item ? rarity : ''}`}
      onClick={onClick}
      title={item ? item.templateId : slot}
    >
      {item ? (
        <div className="itemContent">
          <img
            src={assetsVersion(`/images/${item.type}/${item.templateId}.png`)}
            alt={item.templateId}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="placeholderContent">
          <Icon className="placeholderIcon" />
        </div>
      )}
    </div>
  );
};

export const CharacterPanel = ({
  characterId,
  showNavigation,
  onNext,
  onPrev,
}: CharacterPanelProps) => {
  const character = useGameState(characterSelectors.selectCharacterById(characterId));
  const equipment = useGameState(
    useShallow(equipmentSelectors.selectEquipmentByCharacterId(characterId)),
  );

  const selectedItemEntry = useGameState((state) => state.inventory.selectedItem);
  const selectItemAction = useGameState((state) => state.inventory.actions.selectItem);

  const handleSlotClick = (slot: EquipmentSlot, item: InventoryItem | null | undefined) => {
    if (item) {
      selectItemAction(item, slot);
    }
  };

  if (!character) return <div className="characterPanel">Character not found</div>;

  const faction = (character as any).faction || 'player';
  const appearanceVariation = (character as any).appearanceVariation || '0';

  const characterImageUrl = assetsVersion(
    `/images/characters/${faction}/${character.templateId}_${appearanceVariation}.png`,
  );

  const renderSlotList = (slots: typeof LEFT_SLOTS, side: 'left' | 'right') => (
    <div className={`slotsColumn ${side}`}>
      {slots.map(({ slot, Icon }) => {
        const item = equipment[slot];
        const isSelected =
          selectedItemEntry?.context === slot &&
          selectedItemEntry?.item?.templateId === item?.templateId;

        return (
          <EquipmentSlotItem
            key={slot}
            slot={slot}
            item={item}
            Icon={Icon}
            isSelected={isSelected}
            onClick={() => handleSlotClick(slot, item)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="characterPanel">
      {/* 1. LAYER: BACKGROUND IMAGE */}
      <div className="characterBackground">
        <img
          src={characterImageUrl}
          alt={character.name}
          onError={(e) =>
            ((e.target as HTMLImageElement).src =
              'https://placehold.co/400x800/111/333?text=No+Img')
          }
        />
        <div className="bottomGradient" />
      </div>

      {/* 2. LAYER: UI OVERLAY */}
      <div className="uiLayer">
        {/* HEADER: Name & Nav */}
        <div className="charHeader">
          {showNavigation && (
            <button className="navBtn prev" onClick={onPrev}>
              &lt;
            </button>
          )}

          <h3 className="charName">{character.name}</h3>

          {showNavigation && (
            <button className="navBtn next" onClick={onNext}>
              &gt;
            </button>
          )}
        </div>

        {/* BODY: Slots Left & Right */}
        <div className="equipmentBody">
          {renderSlotList(LEFT_SLOTS, 'left')}
          <div className="centerSpacer" />
          {renderSlotList(RIGHT_SLOTS, 'right')}
        </div>

        {/* FOOTER: Stats Button */}
        <div className="charFooter">
          <button className="statsBtn">Stats</button>
        </div>
      </div>
    </div>
  );
};
