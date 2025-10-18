import { CharacterCreation } from '@/features/CharacterCreation/CharacterCreation';
import { Combat } from '@/features/Combat/Combat';
import { MainMenu } from '@/features/MainMenu/MainMenu';
import { StrategicMap } from '@/features/StrategicMap/StrategicMap';
import { useGameStore } from '@/state/useGameState';

import './App.scss';

function App() {
  const currentScreen = useGameStore((state) => state.ui.currentScreen);

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'mainMenu':
        return <MainMenu />;
      case 'characterCreation':
        return <CharacterCreation />;
      case 'strategicMap':
        return <StrategicMap />;
      case 'combat':
        return <Combat />;
      default:
        return <MainMenu />;
    }
  };

  return <div className="App">{renderCurrentScreen()}</div>;
}

export default App;
