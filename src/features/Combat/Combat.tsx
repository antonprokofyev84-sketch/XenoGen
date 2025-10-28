import { useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useCombatStore } from '@/state/useCombatStore';
import { poiSelectors, useGameStore } from '@/state/useGameState';
import { makeActivePartyCombatUnitsSnapshot } from '@/systems/combat/playerGroupGenerator';
import type { CombatUnit } from '@/types/combat.types';

import { CombatResultView } from './components/CombatResultsView/CombatResultsView';
import { CombatView } from './components/CombatView/CombatView';

export const Combat = () => {
  const selectedPoi = useGameStore(useShallow(poiSelectors.selectSelectedPoi));
  const enemyGroup = selectedPoi?.details?.enemyGroup || [];

  const combatStatus = useCombatStore((state) => state.combatResult.combatStatus);

  useEffect(() => {
    const allies = makeActivePartyCombatUnitsSnapshot(useGameStore.getState());
    const enemies: CombatUnit[] = structuredClone(enemyGroup);
    const allUnits: CombatUnit[] = [...allies, ...enemies];

    useCombatStore.getState().actions.initializeCombat(allUnits);
  }, []);

  if (combatStatus === 'ongoing') {
    return <CombatView />;
  }

  return <CombatResultView />;
};
