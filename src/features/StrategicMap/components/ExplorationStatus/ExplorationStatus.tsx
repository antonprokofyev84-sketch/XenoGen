import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { mapSelectors } from '@/state/gameSlices/map';
import { useGameStore } from '@/state/useGameState';

import './ExplorationStatus.scss';

export const ExplorationStatus = () => {
  const selectedCellId = useGameStore((state) => state.map.selectedCellId);
  const cellData = useGameStore(useShallow(mapSelectors.selectCellById(selectedCellId!)));

  const getStatus = () => {
    if (!cellData.isVisited) {
      return { text: textData.strategicMap.statusUnexplored, className: 'unexplored' };
    }
    if (cellData.explorationDaysLeft === null) {
      let statusText = textData.strategicMap.statusPermanent;
      if (cellData.explorationLevel > 0) {
        statusText += ` | ${textData.strategicMap.scoutScoreLabel}: ${cellData.explorationLevel}`;
      }
      return { text: statusText, className: 'permanent' };
    }
    if (cellData.explorationDaysLeft === 0) {
      return { text: textData.strategicMap.statusOutdated, className: 'outdated' };
    }
    if (cellData.explorationDaysLeft > 0) {
      let statusText = textData.strategicMap.statusActive.replace(
        '{days}',
        String(cellData.explorationDaysLeft),
      );
      if (cellData.explorationLevel > 0) {
        statusText += ` | ${textData.strategicMap.scoutScoreLabel}: ${cellData.explorationLevel}`;
      }
      return { text: statusText, className: 'active' };
    }
    // Запасной вариант на всякий случай
    return { text: textData.strategicMap.statusOutdated, className: 'outdated' };
  };

  const { text, className } = getStatus();

  return <div className={`explorationStatus ${className}`}>{text}</div>;
};
