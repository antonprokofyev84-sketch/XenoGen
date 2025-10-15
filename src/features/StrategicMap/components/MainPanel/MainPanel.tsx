import { GridOverlay } from '../GridOverlay/GridOverlay';

import './MainPanel.scss';

export const MainPanel = () => {
  return (
    <main className="mapArea">
      <div className="mapViewport">
        <div className="mapContent">
          <GridOverlay />
        </div>
      </div>
    </main>
  );
};
