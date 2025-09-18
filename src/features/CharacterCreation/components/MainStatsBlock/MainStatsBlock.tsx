import { useCallback } from 'react';
import { useGameStore, playerSelectors } from '@/state/useGameState';
import { useShallow } from 'zustand/react/shallow';
import type { MainStatKey } from '@/types/character.types';
import { mainStatKeys, initiatMainStatValue } from '@/state/constants';

import textData from '@/locales/en.json';
import './MainStatsBlock.scss';

interface MainStatsBlockProps {
  freePoints: number;
  onStatChange: (statKey: MainStatKey, delta: number) => void;
  pointStep?: number;
  minStat?: number;
  maxStat?: number;
}

export const MainStatsBlock = ({
  freePoints,
  onStatChange,
  pointStep = 5,
  minStat = 30,
  maxStat = 70,
}: MainStatsBlockProps) => {
  console.log('MainStatsBlock render');
  const mainStats = useGameStore(useShallow(playerSelectors.mainStats));
  const mainStatsEffective = useGameStore(useShallow(playerSelectors.effectiveMainStats));

  const statKeys = mainStatKeys;

  const getStatValueClass = useCallback((currentValue: number) => {
    if (currentValue > initiatMainStatValue) return 'increased';
    if (currentValue < initiatMainStatValue) return 'decreased';
    return '';
  }, []);

  return (
    <div className="mainStatsBlock">
      <h2 className="mainStatsHeader">{textData.characterCreation.mainStatsTitle}</h2>
      {statKeys.map((statKey) => {
        const currentStatValue = mainStats[statKey];
        const effectiveStatValue = mainStatsEffective[statKey];
        const canAdd = freePoints >= pointStep && currentStatValue + pointStep <= maxStat;
        const canRemove = currentStatValue - pointStep >= minStat;

        return (
          <div className="statRow" key={statKey}>
            <span className="statName">{textData.stats[statKey]}</span>
            <span className={`statValue ${getStatValueClass(currentStatValue)}`}>
              {effectiveStatValue}
            </span>
            <div className="statButtons">
              <button
                className="statButton remove"
                onClick={() => onStatChange(statKey, -pointStep)}
                disabled={!canRemove}
              >
                -{pointStep}
              </button>
              <button
                className="statButton add"
                onClick={() => onStatChange(statKey, pointStep)}
                disabled={!canAdd}
              >
                +{pointStep}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
