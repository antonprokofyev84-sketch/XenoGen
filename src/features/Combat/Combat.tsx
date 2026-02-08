import { useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useCombatState } from '@/state/useCombatState';
import { poiSelectors, useGameState } from '@/state/useGameState';
import { makeActivePartyCombatUnitsSnapshot } from '@/systems/combat/playerGroupGenerator';
import type { CombatUnit } from '@/types/combat.types';

import { CombatResultView } from './components/CombatResultsView/CombatResultsView';
import { CombatView } from './components/CombatView/CombatView';

export const Combat = () => {
  const selectedPoi = useGameState(useShallow(poiSelectors.selectSelectedPoi));
  const enemyGroup = selectedPoi?.details?.enemyGroup || [];
  const initializeCombat = useCombatState((state) => state.actions.initializeCombat);

  const combatStatus = useCombatState((state) => state.combatResult.combatStatus);

  useEffect(() => {
    const allies = makeActivePartyCombatUnitsSnapshot(useGameState.getState());
    const enemies: CombatUnit[] = structuredClone(enemyGroup);
    initializeCombat([...allies, ...enemies]);
  }, []);

  if (combatStatus === 'ongoing') {
    return <CombatView />;
  }

  return <CombatResultView />;
};
