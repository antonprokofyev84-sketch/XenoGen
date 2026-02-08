import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { poiSelectors, useGameState } from '@/state/useGameState';
import { useMapInteractionStore } from '@/state/useMapInteractionStore';

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
  const partyPosition = useGameState((state) => state.party.currentPartyPosition);
  const selectedCellId = useMapInteractionStore((state) => state.focusedPoiId);
  const selectedCell = useGameState(poiSelectors.selectPoiById(selectedCellId!));
  const travelToPoi = useGameState((state) => state.world.actions.travelToPoi);

  const poisToDisplay = useGameState(
    useShallow(poiSelectors.selectDiscoveredChildrenOfPoi(selectedCellId!)),
  );

  if (!selectedCell || selectedCell.type !== 'cell') {
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
    selectedCell.details.explorationDaysLeft === null ||
    (selectedCell.details.explorationDaysLeft && selectedCell.details.explorationDaysLeft > 0);

  return (
    <aside className="leftPanel">
      <div className="panelHeader">
        <h3>
          {textData.mapCellTypes[selectedCell.details.terrain]} ({selectedCell.details.col},{' '}
          {selectedCell.details.row})
        </h3>
        <ExplorationStatus />
      </div>
      <div className="panelContent">
        {/* Показываем блок статов только если ячейка была посещена */}
        {selectedCell.details.visitedTimes > 0 ? (
          <div className="statsSection">
            <StatProgressBar
              label="Threat"
              level={Math.floor(selectedCell.details.threat / 100)}
              progress={selectedCell.details.threat % 100}
              isIntelOutdated={!isCellExplored}
            />
            <StatProgressBar
              label="Prosperity"
              level={Math.floor(selectedCell.details.prosperity / 100)}
              progress={selectedCell.details.prosperity % 100}
              isIntelOutdated={!isCellExplored}
            />
            <StatProgressBar
              label="Contamination"
              level={Math.floor(selectedCell.details.contamination / 100)}
              progress={selectedCell.details.contamination % 100}
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
                  onClick={() => {
                    travelToPoi(poi.id);
                  }}
                  disabled={partyPosition !== selectedCellId}
                >
                  {textData.poi[poi.details.poiTemplateId as keyof typeof textData.poi]?.name ||
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
