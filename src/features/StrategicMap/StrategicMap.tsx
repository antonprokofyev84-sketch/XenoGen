import { useState } from 'react';

import { BottomBar } from './components/BottomBar/BottomBar';
import { GridOverlay } from './components/GridOverlay/GridOverlay';
import { LeftPanel } from './components/LeftPanel/LeftPanel';

import './StrategicMap.scss';

export const StrategicMap = () => {
  console.log('Rendering StrategicMap');

  return (
    <div className="strategicMapContainer">
      {/* Левая область для информации о POI */}
      <LeftPanel />

      <main className="mapArea">
        <div className="mapViewport">
          <div className="mapContent">
            <GridOverlay />
          </div>
        </div>
      </main>

      <BottomBar />
    </div>
  );
};
