import { mapSelectors, useGameStore } from '@/state/useGameState';

import { GridOverlay } from '../GridOverlay/GridOverlay';
import { PoiPreview } from '../PoiPreview/PoiPreview';

import './MainPanel.scss';

export const MainPanel = () => {
  const selectedPoiId = useGameStore((state) => state.map.selectedPoiId);

  return (
    <main className="mainPanel">
      {/* 2. Используем условный рендеринг */}
      {selectedPoiId ? (
        // Если POI выбран, показываем его предпросмотр с анимацией
        <div className="poiPreviewContainer fadeIn">
          <PoiPreview />
        </div>
      ) : (
        <div className="mapArea">
          <div className="mapViewport">
            <div className="mapContent">
              <GridOverlay />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
