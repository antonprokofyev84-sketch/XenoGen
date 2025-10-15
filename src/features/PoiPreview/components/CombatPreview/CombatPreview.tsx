import { useShallow } from 'zustand/react/shallow';

import { poiSelectors, useGameStore } from '@/state/useGameState';

import { CharacterCard } from '../CharacterCard/CharacterCard';

import './CombatPreview.scss';

export const CombatPreview = () => {
  const selectedPoi = useGameStore(useShallow(poiSelectors.selectSelectedPoi));

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
          <CharacterCard key={enemy.instanceId} character={enemy} />
        ))}
      </div>
      {/* В будущем здесь будут кнопки "Атаковать" / "Отступить" */}
    </div>
  );
};
