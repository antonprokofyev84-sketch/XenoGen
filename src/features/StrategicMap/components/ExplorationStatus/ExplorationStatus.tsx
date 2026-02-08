import textData from '@/locales/en.json';
import { poiSelectors, useGameState } from '@/state/useGameState';
import { useMapInteractionStore } from '@/state/useMapInteractionStore';

import './ExplorationStatus.scss';

export const ExplorationStatus = () => {
  const selectedCellId = useMapInteractionStore((state) => state.focusedPoiId);
  const selectedCell = useGameState(poiSelectors.selectPoiById(selectedCellId!));
  if (selectedCell?.type !== 'cell') {
    return null;
  }

  const cellData = selectedCell?.details;

  const getStatus = () => {
    if (cellData.visitedTimes === 0) {
      return { text: textData.strategicMap.statusUnexplored, className: 'unexplored' };
    }
    if (cellData.explorationDaysLeft === Infinity) {
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
