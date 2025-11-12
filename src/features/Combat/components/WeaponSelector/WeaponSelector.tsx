import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/Button/Button';
import { combatSelectors, useCombatState } from '@/state/useCombatState';
import type { CombatUnit } from '@/types/combat.types';
import type { WeaponSlots } from '@/types/equipment.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './WeaponSelector.scss';

const WeaponSlotButton = ({
  unit,
  label,
  slot,
  currentActiveSlot,
  onSelect,
}: {
  unit: CombatUnit;
  label: string;
  slot: WeaponSlots;
  currentActiveSlot: WeaponSlots;
  onSelect: (slot: WeaponSlots) => void;
}) => {
  const weapon = unit.equipment[slot];
  const isDisabled = !weapon;
  const isChecked = currentActiveSlot === slot;

  return (
    <div className="radio-option">
      <input
        type="radio"
        id={`weapon-${slot}-${unit.id}`}
        name={`weapon-select-${unit.id}`}
        checked={isChecked}
        onChange={() => onSelect(slot)}
        disabled={isDisabled}
      />
      <label
        htmlFor={`weapon-${slot}-${unit.id}`}
        title={label || 'Empty Slot'}
        className={`${isDisabled ? 'no-weapon' : ''} ${isChecked ? 'active' : ''}`}
      >
        {weapon ? (
          <img
            src={assetsVersion(`/images/weapon/${weapon.templateId}.png`)}
            alt={weapon.templateId}
          />
        ) : (
          <span className="empty-slot-text">Empty</span>
        )}
      </label>
    </div>
  );
};

export const WeaponSelector = () => {
  const activeUnit = useCombatState(useShallow(combatSelectors.selectCurrentActiveUnit));
  const setActiveWeaponSlot = useCombatState((state) => state.actions.setActiveWeaponSlot);
  const endTurn = useCombatState((state) => state.actions.endTurn);
  const activeWeaponSlot = useCombatState(
    useShallow((state) =>
      activeUnit ? state.unitsById[activeUnit.id].activeWeaponSlot : undefined,
    ),
  );

  if (!activeUnit || activeUnit.faction !== 'player') {
    return <div className="weapon-selector-frame-placeholder" />;
  }

  const { id } = activeUnit;

  const handleSlotChange = (slot: WeaponSlots) => {
    setActiveWeaponSlot(id, slot);
  };

  const handleEndTurnClick = () => {
    endTurn();
  };

  return (
    <fieldset className="weapon-selector-frame" role="radiogroup">
      {/* --- Группа Melee --- */}
      <div className="weapon-group">
        <legend>Melee</legend>
        <div className="weapon-grid">
          <WeaponSlotButton
            unit={activeUnit}
            label="Melee Primary"
            slot="meleePrimary"
            currentActiveSlot={activeWeaponSlot!}
            onSelect={() => handleSlotChange('meleePrimary')}
          />
          <WeaponSlotButton
            unit={activeUnit}
            label="Melee Secondary"
            slot="meleeSecondary"
            currentActiveSlot={activeWeaponSlot!}
            onSelect={() => handleSlotChange('meleeSecondary')}
          />
        </div>
      </div>

      {/* --- Группа Ranged --- */}
      <div className="weapon-group">
        <legend>Ranged</legend>
        <div className="weapon-grid">
          <WeaponSlotButton
            unit={activeUnit}
            label="Ranged Primary"
            slot="rangePrimary"
            currentActiveSlot={activeWeaponSlot!}
            onSelect={() => handleSlotChange('rangePrimary')}
          />
          <WeaponSlotButton
            unit={activeUnit}
            label="Ranged Secondary"
            slot="rangeSecondary"
            currentActiveSlot={activeWeaponSlot!}
            onSelect={() => handleSlotChange('rangeSecondary')}
          />
        </div>
      </div>

      <div className="end-turn-container">
        <Button variant="ghost" color="red" onClick={handleEndTurnClick}>
          Skip Turn
        </Button>
      </div>
    </fieldset>
  );
};
