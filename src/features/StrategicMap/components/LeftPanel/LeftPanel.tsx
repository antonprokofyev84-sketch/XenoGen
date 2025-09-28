import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { mapSelectors } from '@/state/slices/map';
import { poiSelectors } from '@/state/slices/poi';
import { useGameStore } from '@/state/useGameState';

import './LeftPanel.scss';

// Простой внутренний компонент для отображения прогресс-баров
const StatProgressBar = ({
  label,
  level,
  progress,
}: {
  label: string;
  level: number;
  progress: number;
}) => (
  <div className="statProgressBar">
    <div className="labels">
      <span>{label}</span>
      <span>Lvl {level}</span>
    </div>
    <div className="bar">
      <div className="progress" style={{ width: `${progress}%` }} />
    </div>
  </div>
);

export const LeftPanel = () => {
  const selectedCellId = useGameStore(useShallow((state) => state.map.selectedCellId));
  const cellData = useGameStore(useShallow(mapSelectors.selectCellById(selectedCellId!)));
  const poisInCell = useGameStore(useShallow(poiSelectors.selectPoisByCellId(selectedCellId!)));

  // Если ячейка не выбрана или по ней нет данных, показываем заглушку
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

  return (
    <aside className="leftPanel">
      <div className="panelHeader">
        <h3>{textData.mapCellTypes[cellData.type]}</h3>
        <span className="cellCoords">
          ({cellData.col}, {cellData.row})
        </span>
      </div>
      <div className="panelContent">
        <div className="statsSection">
          <StatProgressBar
            label="Threat"
            level={cellData.threatLevel}
            progress={cellData.threatProgress}
          />
          <StatProgressBar
            label="Prosperity"
            level={cellData.prosperityLevel}
            progress={cellData.prosperityProgress}
          />
          <StatProgressBar
            label="Contamination"
            level={cellData.contaminationLevel}
            progress={cellData.contaminationProgress}
          />
        </div>

        <div className="poiSection">
          <h4>Points of Interest</h4>
          <div className="poiList">
            {poisInCell.length > 0 ? (
              poisInCell.map((poi) => {
                return (
                  <button key={poi.id} className="poiButton">
                    {textData.poi[poi.poiTemplateId as keyof typeof textData.poi]?.name ||
                      'Unknown POI'}
                  </button>
                );
              })
            ) : (
              <p className="noPoisText">No points of interest discovered.</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
