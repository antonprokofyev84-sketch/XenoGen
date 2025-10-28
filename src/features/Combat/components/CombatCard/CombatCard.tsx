import { useEffect, useRef, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { combatSelectors, useCombatStore } from '@/state/useCombatStore';
import type { AttackForecast } from '@/systems/combat/combatHelpers';
import { calculateAttackForecast } from '@/systems/combat/combatHelpers';
import { assetsVersion } from '@/utils/assetsVersion';

import { DamageFloatStagger } from '../DamageFloatStagger/DamageFloatStagger';

import './CombatCard.scss';

interface CombatCardProps {
  unitId: string;
}

export const CombatCard = ({ unitId }: CombatCardProps) => {
  const unit = useCombatStore((state) => state.unitsById[unitId]);
  const activeUnit = useCombatStore((state) => combatSelectors.selectCurrentActiveUnit(state));

  const { swapPosition, processAITurn, endTurn, attack } = useCombatStore(
    useShallow((state) => state.actions),
  );
  const occupiedPositions = useCombatStore(
    useShallow(combatSelectors.selectLinesOccupancyForUnits),
  );

  const {
    templateId,
    rarity,
    appearanceVariation,
    faction,
    equipment,
    activeWeaponSlot,
    position,
    stats,
  } = unit;

  const activeTurnKey = useCombatStore(
    (state) => combatSelectors.selectCurrentTurnItem(state)?.time,
  );

  const [localPosition, setLocalPosition] = useState(position);
  const [forecast, setForecast] = useState<AttackForecast | null>(null);

  const isActive = useCombatStore((state) => combatSelectors.selectIsUnitActive(unitId)(state));
  const isAlly = unit.faction === 'player';

  const weapon = equipment[activeWeaponSlot]!;
  const characterImageUrl = `/images/characters/${faction}/${templateId}_${appearanceVariation}.png`;
  const weaponImageUrl = `/images/weapon/${weapon.templateId}.png`;

  const lastProcessedKeyRef = useRef<number | null>(null);

  const handlePositionClick = () => {
    swapPosition(unitId);
  };

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== 'top') {
      return;
    }

    if (isActive) {
      endTurn();
      setLocalPosition(position);
    } else if (position !== localPosition) {
      setLocalPosition(position);
    }
  };

  const handleClick = () => {
    if (forecast) {
      attack(forecast);
    }
  };

  useEffect(() => {
    if (
      !isAlly &&
      isActive &&
      Number.isFinite(activeTurnKey) && // activeTurnKey can be 0
      lastProcessedKeyRef.current !== activeTurnKey
    ) {
      // this ref prevents multiple AI processes for the same turn
      // this is mostly happens in development mode with React StrictMode
      lastProcessedKeyRef.current = activeTurnKey as number;
      setTimeout(() => {
        processAITurn();
      }, 1000);
    }
  }, [isActive, isAlly, activeTurnKey]);

  useEffect(() => {
    if (activeUnit && activeUnit.faction === 'player') {
      if (unit.faction !== 'player' && unit.status === 'alive') {
        const result = calculateAttackForecast(activeUnit, unit, occupiedPositions);
        setForecast(result);
      } else {
        setForecast(null);
      }
    } else {
      setForecast(null);
    }
  }, [activeUnit, unit, occupiedPositions]);

  return (
    <div className={`cardPositionContainer`}>
      {isActive && isAlly && (
        <div className={`move-overlay movePosition${localPosition}`} onClick={handlePositionClick}>
          {localPosition === 0 && (
            <div className="move-indicator move-forward">
              <span>{textData.combat.moveForward}</span>
            </div>
          )}
          {localPosition === 1 && (
            <div className="move-indicator move-backward">
              <span>{textData.combat.moveBack}</span>
            </div>
          )}
        </div>
      )}

      <div
        className={`combatCard ${rarity} cardPosition${position} ${localPosition !== position ? 'isMoving' : ''}`}
        onTransitionEnd={handleTransitionEnd}
        onClick={handleClick}
      >
        <div className="stats-display">
          <div className="stat-bubble hp" title={`HP: ${stats.hp}`}>
            <span>{stats.hp}</span>
          </div>
          <div className="stat-bubble armor" title={`Armor: ${stats.armor}`}>
            <span>{stats.armor}</span>
          </div>
          <div className="stat-bubble initiative" title={`Initiative: ${stats.initiative}`}>
            <span>{stats.initiative}</span>
          </div>
        </div>

        <div className="image-container">
          <img src={assetsVersion(characterImageUrl)} alt={templateId} loading="lazy" />
        </div>

        <div className="weapon-display">
          <img
            className="weapon-icon"
            src={assetsVersion(weaponImageUrl)}
            alt={weapon.templateId}
          />
          <span className="weapon-name">{weapon.templateId}</span>
        </div>
        <DamageFloatStagger unitId={unitId} />
      </div>
    </div>
  );
};
