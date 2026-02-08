import { CharacterCreation } from '@/features/CharacterCreation/CharacterCreation';
import { CharacterDetails } from '@/features/CharacterDetails/CharacterDetails';
import { Combat } from '@/features/Combat/Combat';
import { MainMenu } from '@/features/MainMenu/MainMenu';
import { PoiView } from '@/features/PoiView/PoiView';
import { StrategicMap } from '@/features/StrategicMap/StrategicMap';
import { useGameState } from '@/state/useGameState';

import './App.scss';

function App() {
  const currentScreen = useGameState((state) => state.ui.currentScreen);

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'mainMenu':
        return <MainMenu />;
      case 'characterCreation':
        return <CharacterCreation />;
      case 'strategicMap':
        return <StrategicMap />;
      case 'poiView':
        return <PoiView />;
      case 'combat':
        return <Combat />;
      case 'characterDetails':
        return <CharacterDetails />;
      default:
        return <MainMenu />;
    }
  };

  return <div className="App">{renderCurrentScreen()}</div>;
}

export default App;
