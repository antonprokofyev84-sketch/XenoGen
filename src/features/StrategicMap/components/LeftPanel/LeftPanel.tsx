import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { mapSelectors } from '@/state/slices/map';
import { poiSelectors } from '@/state/slices/poi';
import { useGameStore } from '@/state/useGameState';

import { ExplorationStatus } from '../ExplorationStatus/ExplorationStatus';
import { LeftPanelFooter } from '../LeftPanelFooter/LeftPanelFooter';

import './LeftPanel.scss';

// Внутренний компонент для прогресс-баров теперь принимает флаг isIntelOutdated
const StatProgressBar = ({
  label,
  level,
  progress,
  isIntelOutdated,
}: {
  label: string;
  level: number;
  progress: number;
  isIntelOutdated: boolean;
}) => (
  <div className="statProgressBar">
    <div className="labels">
      <span>{label}:</span>
      <span>Lvl {level}</span>
    </div>
    {/* Добавляем класс 'outdated', если данные устарели */}
    <div className={`bar ${isIntelOutdated ? 'outdated' : ''}`}>
      {/* Прогресс и значение показываем только если данные актуальны */}
      {!isIntelOutdated && (
        <>
          <div className="progress" style={{ width: `${progress}%` }} />
          <div className="progressValue">{progress}%</div>
        </>
      )}
    </div>
  </div>
);

export const LeftPanel = () => {
  const partyPosition = useGameStore((state) => state.party.currentPartyPosition);
  const selectedCellId = useGameStore((state) => state.map.selectedCellId);
  const cellData = useGameStore(useShallow(mapSelectors.selectCellById(selectedCellId!)));
  const poisToDisplay = useGameStore(
    useShallow(poiSelectors.selectVisiblePoisByCellId(selectedCellId!)),
  );

  if (!cellData) {
    return (
      <aside className="leftPanel">
        <div className="panelHeader">
          <h3>{textData.strategicMap.sectorInfo}</h3>
        </div>
        <div className="panelContent placeholder">
          <p>{textData.strategicMap.selectSector}</p>
        </div>
      </aside>
    );
  }

  // Определяем, актуальны ли разведданные
  const isCellExplored =
    cellData.explorationDaysLeft === null ||
    (cellData.explorationDaysLeft && cellData.explorationDaysLeft > 0);

  return (
    <aside className="leftPanel">
      <div className="panelHeader">
        <h3>
          {textData.mapCellTypes[cellData.type]} ({cellData.col}, {cellData.row})
        </h3>
        <ExplorationStatus />
      </div>
      <div className="panelContent">
        {/* Показываем блок статов только если ячейка была посещена */}
        {cellData.isVisited ? (
          <div className="statsSection">
            <StatProgressBar
              label="Threat"
              level={cellData.threatLevel}
              progress={cellData.threatProgress}
              isIntelOutdated={!isCellExplored}
            />
            <StatProgressBar
              label="Prosperity"
              level={cellData.prosperityLevel}
              progress={cellData.prosperityProgress}
              isIntelOutdated={!isCellExplored}
            />
            <StatProgressBar
              label="Contamination"
              level={cellData.contaminationLevel}
              progress={cellData.contaminationProgress}
              isIntelOutdated={!isCellExplored}
            />
          </div>
        ) : (
          // Если ячейка не посещалась, показываем заглушку
          <div className="statsSection placeholder">
            <p>Detailed stats are unavailable for unvisited sectors.</p>
          </div>
        )}

        <div className="poiSection">
          <h4>Points of Interest</h4>
          <div className="poiList">
            {poisToDisplay.length > 0 ? (
              poisToDisplay.map((poi) => (
                <button
                  key={poi.id}
                  className="poiButton"
                  disabled={partyPosition !== selectedCellId}
                >
                  {textData.poi[poi.poiTemplateId as keyof typeof textData.poi]?.name ||
                    'Unknown POI'}
                </button>
              ))
            ) : (
              <p className="noPoisText">No points of interest discovered.</p>
            )}
          </div>
        </div>
      </div>
      <LeftPanelFooter />
    </aside>
  );
};
