import { useEffect, useState } from 'react';

import textData from '@/locales/en.json';
import { combatSelectors, useCombatStore } from '@/state/useCombatStore';
import { assetsVersion } from '@/utils/assetsVersion';

import './CombatCard.scss';

interface CombatCardProps {
  unitId: string;
}

export const CombatCard = ({ unitId }: CombatCardProps) => {
  // 1. Получаем глобальный unit и его position
  const unit = useCombatStore((state) => state.unitsById[unitId]);
  const {
    templateId,
    rarity,
    appearanceVariation,
    faction,
    equipment,
    activeWeaponSlot,
    position,
  } = unit;

  const swapPosition = useCombatStore((state) => state.actions.swapPosition);
  const endTurn = useCombatStore((state) => state.actions.endTurn);
  const currentTurnItem = useCombatStore(combatSelectors.selectCurrentTurnItem);

  const [localPosition, setLocalPosition] = useState(position);

  const isActive = currentTurnItem?.unitId === unitId;
  const isAlly = unit.faction === 'player';

  const weapon = equipment[activeWeaponSlot]!;
  const characterImageUrl = `/images/characters/${faction}/${templateId}_${appearanceVariation}.png`;
  const weaponImageUrl = `/images/weapon/${weapon.templateId}.png`;

  // 6. Клик (для союзников) просто вызывает swapPosition
  const handlePositionClick = () => {
    // Не меняем localPosition!
    // Просто меняем глобальный 'position'
    swapPosition(unitId);
    // Анимация начнется сама, т.к. .combatCard зависит от 'position'
  };

  // 7. Обработчик конца анимации
  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    // Мы анимируем 'top'. Убедимся, что это та самая анимация
    if (e.propertyName !== 'top') {
      return;
    }

    // Если это был наш ход (isActive) и анимация догнала (position !== localPosition)
    // И мы - инициатор (т.к. мы союзник и это был наш ход)
    if (isActive) {
      endTurn();
      setLocalPosition(position);
    } else if (position !== localPosition) {
      setLocalPosition(position);
    }
  };

  return (
    <div className={`cardPositionContainer`}>
      {/* Оверлей теперь зависит от localPosition.
        Он "замрет" на старой позиции, пока карточка анимируется 
      */}
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

      {/* Карточка теперь зависит от position (из стора).
        Как только 'position' в сторе меняется, карточка НАЧИНАЕТ АНИМАЦИЮ
      */}
      <div
        className={`combatCard ${rarity} cardPosition${position}`}
        onTransitionEnd={handleTransitionEnd} // 8. Привязываем обработчик
      >
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
      </div>
    </div>
  );
};
