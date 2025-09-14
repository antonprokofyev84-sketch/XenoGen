import { useGameStore } from '@/state/useGameState.ts';
import './MainMenu.scss';

export const MainMenu = () => {
  const goToScreen = useGameStore((state) => state.ui.goToScreen);

  const handleNewGame = () => {
    goToScreen('characterCreation');
  };

  const handleLoadGame = () => {
    console.log('Load Game clicked!');
  };

  return (
    <div className="main-menu-container">
      <h1 className="title">XenoGen</h1>

      <div className="buttons-container">
        <button onClick={handleNewGame}>New Game</button>
        <button onClick={handleLoadGame}>Load Game</button>
      </div>
    </div>
  );
};
