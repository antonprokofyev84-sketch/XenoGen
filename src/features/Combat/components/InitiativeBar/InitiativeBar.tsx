import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useShallow } from 'zustand/react/shallow';

import { useCombatState } from '@/state/useCombatState';
import type { InitiativeItem } from '@/systems/combat/combatInitiativeHelpers';
import type { CombatUnit } from '@/types/combat.types';
import { assetsVersion } from '@/utils/assetsVersion';

import './InitiativeBar.scss';

const DISPLAY_LIMIT = 12;

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
  const queue = useCombatState((state) => state.initiativeQueue);
  const units = useCombatState((state) => state.unitsById);

  const visibleQueue = queue.slice(0, DISPLAY_LIMIT);

  const [animationParent] = useAutoAnimate<HTMLUListElement>({ duration: 500 });
  // const [animationParent] = useAutoAnimate<HTMLUListElement>();

  return (
    <aside className="initiativeBarContainer">
      <ul ref={animationParent}>
        {visibleQueue.map((item) => renderInitiativeItem(item, units, highlightedUnitId))}
      </ul>
    </aside>
  );
};
