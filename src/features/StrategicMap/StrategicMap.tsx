import { useGameStore } from '@/state/useGameState';
import { GridOverlay } from './components/GridOverlay';
import './StrategicMap.scss';

export const StrategicMap = () => {
  const goToScreen = useGameStore((state) => state.ui.goToScreen);

  return (
    <div className="strategicMapContainer">
      {/* Левая область для информации о POI */}
      <aside className="leftPanel">
        <div className="panelHeader">
          <h3>Sector Info</h3>
        </div>
        <div className="panelContent">
          <p>Select a sector on the map to see details.</p>
        </div>
      </aside>

      <main className="mapArea">
        <div className="mapViewport">
          <div className="mapContent">
            <GridOverlay />
          </div>
        </div>
      </main>

      {/* Нижняя область для UI */}
      <footer className="bottomBar">
        <div className="barContent">BOTTOM BAR (Party Portraits, UI Controls, etc.)</div>
      </footer>
    </div>
  );
};
