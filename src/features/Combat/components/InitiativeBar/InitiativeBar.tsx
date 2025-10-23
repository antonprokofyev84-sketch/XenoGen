import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useShallow } from 'zustand/react/shallow';

import { useCombatStore } from '@/state/useCombatStore';
import type { InitiativeItem } from '@/systems/combat/initiativeHelpers';
import type { CombatUnit } from '@/types/combat.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './InitiativeBar.scss';

const DISPLAY_LIMIT = 14;

const ANIMATION_DURATION = 400;

interface InitiativeBarProps {
  highlightedUnitId?: string | null;
}

const renderInitiativeItem = (
  item: InitiativeItem,
  units: Record<string, CombatUnit>,
  highlightedUnitId?: string | null,
) => {
  const unit = units[item.unitId];
  if (!unit) return null;

  const isPlayer = unit.faction === 'player';
  const isHighlighted = item.unitId === highlightedUnitId;

  const itemClasses = [
    'initiative-item',
    isPlayer ? 'player' : 'enemy',
    isHighlighted ? 'highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const imageUrl = `/images/characters/${unit.faction}/${unit.templateId}_${unit.appearanceVariation}.png`;

  const itemKey = `${item.unitId}_${item.time}`;

  return (
    <li key={itemKey} className={itemClasses}>
      <div className="portrait">
        <img src={assetsVersion(imageUrl)} alt={unit.templateId} loading="lazy" />
      </div>
    </li>
  );
};

export const InitiativeBar = ({ highlightedUnitId }: InitiativeBarProps) => {
  const { queue, units } = useCombatStore(
    useShallow((state) => ({
      queue: state.initiativeQueue,
      units: state.unitsById,
    })),
  );

  const visibleQueue = queue.slice(0, DISPLAY_LIMIT);

  const [animationParent] = useAutoAnimate<HTMLUListElement>((el, action, oldCoords, newCoords) => {
    let keyframes: Keyframe[] = [];
    const options: KeyframeAnimationOptions = {
      duration: ANIMATION_DURATION,
      easing: 'ease-out',
    };

    if (action === 'remove') {
      keyframes = [{ opacity: 1 }, { opacity: 0 }];
    } else if (action === 'add') {
      keyframes = [{ opacity: 0 }, { opacity: 1 }];
    } else if (action === 'remain' && oldCoords && newCoords) {
      const deltaX = oldCoords.left - newCoords.left;
      let deltaY = oldCoords.top - newCoords.top;
      // хак для анимации
      if (deltaY > 0 && deltaY < 100) deltaY += 30;

      const start: Keyframe = {
        transform: `translate(${deltaX}px, ${deltaY}px)`,
      };
      const end: Keyframe = {
        transform: `translate(0, 0)`,
      };

      keyframes = [start, end];
    }

    return new KeyframeEffect(el, keyframes, options);
  });

  return (
    <aside className="initiativeBarContainer">
      <ul ref={animationParent}>
        {visibleQueue.map((item) => renderInitiativeItem(item, units, highlightedUnitId))}
      </ul>
    </aside>
  );
};
