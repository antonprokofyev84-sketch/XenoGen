import { useShallow } from 'zustand/react/shallow';

import { CharacterCard } from '@/components/CharacterCard/CharacterCard';
import { poiSelectors, useGameState } from '@/state/useGameState';

import './CombatPreview.scss';

export const CombatPreview = () => {
  const selectedPoi = useGameState(useShallow(poiSelectors.selectSelectedPoi));

  const enemyGroup = selectedPoi?.details?.enemyGroup || [];

  if (enemyGroup.length === 0) {
    return (
      <div className="combatPreview placeholder">
        <h2>No enemies generated.</h2>
        <p>This might happen if the budget is too low or no valid templates were found.</p>
      </div>
    );
  }

  return (
    <div className="combatPreview">
      <div className="enemy-group-container">
        {enemyGroup.map((enemy) => (
          <CharacterCard
            key={enemy.id}
            templateId={enemy.templateId}
            appearanceVariation={enemy.appearanceVariation}
            faction={enemy.faction}
            level={enemy.level}
            rarity={enemy.rarity}
          />
        ))}
      </div>
    </div>
  );
};
