import { GridOverlay } from '../GridOverlay/GridOverlay';

import './MainPanel.scss';

export const MainPanel = ({ readOnly = false }: { readOnly?: boolean }) => {
  return (
    <main className="mapArea">
      <div className="mapViewport">
        <div className="mapContent">
          <GridOverlay readOnly={readOnly} />
        </div>
      </div>
    </main>
  );
};
