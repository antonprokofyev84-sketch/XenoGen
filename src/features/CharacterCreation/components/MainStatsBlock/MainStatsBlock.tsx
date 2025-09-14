import { useGameStore, playerSelectors } from '@/state/useGameState';
import { useShallow } from 'zustand/react/shallow';
import type { MainStatKey } from '@/state/slices/player';
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

  const statKeys = Object.keys(mainStats) as MainStatKey[];

  return (
    <div className="mainStatsBlock">
      <h2 className="mainStatsHeader">{textData.characterCreation.mainStatsTitle}</h2>
      {statKeys.map((statKey) => {
        const currentStatValue = mainStats[statKey];
        const canAdd = freePoints >= pointStep && currentStatValue < maxStat;
        const canRemove = currentStatValue > minStat;

        return (
          <div className="statRow" key={statKey}>
            <span className="statName">{textData.stats[statKey]}</span>
            <span className="statValue">{currentStatValue}</span>
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
