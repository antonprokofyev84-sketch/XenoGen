import { useShallow } from 'zustand/react/shallow';

import { combatSelectors, useCombatState } from '@/state/useCombatState';

import './CapturedSection.scss';

export const CapturedSection = () => {
  const combatStatus = useCombatState((state) => state.combatResult.combatStatus);
  const unconsciousEnemies = useCombatState(useShallow(combatSelectors.selectUnconsciousEnemies));

  if (combatStatus !== 'victory' || unconsciousEnemies.length === 0) {
    return null;
  }

  return (
    <div className="capturedBlock">
      <h2>Captured</h2>
      <ul>
        {unconsciousEnemies.map((enemy) => (
          <li key={enemy.instanceId}>{enemy.templateId}</li>
        ))}
      </ul>
    </div>
  );
};
