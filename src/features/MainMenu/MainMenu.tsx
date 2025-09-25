import { useGameStore } from '@/state/useGameState.ts';
import { useShallow } from 'zustand/react/shallow';
import './MainMenu.scss';

export const MainMenu = () => {
  const { characterActions, goToScreen } = useGameStore(
    useShallow((state) => ({
      characterActions: state.characters.actions,
      goToScreen: state.ui.goToScreen,
    })),
  );

  const handleNewGame = () => {
    characterActions.resetProtagonist();
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
