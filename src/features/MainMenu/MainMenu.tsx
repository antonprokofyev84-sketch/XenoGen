import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/Button/Button';
import { useGameState } from '@/state/useGameState.ts';

import './MainMenu.scss';

export const MainMenu = () => {
  const resetProtagonist = useGameState((state) => state.characters.actions.resetProtagonist);
  const goToScreen = useGameState((state) => state.ui.goToScreen);

  const handleNewGame = () => {
    resetProtagonist();
    goToScreen('characterCreation');
  };

  const handleLoadGame = () => {
    console.log('Load Game clicked!');
  };

  return (
    <div className="main-menu-container">
      <h1 className="title">XenoGen</h1>

      <div className="buttons-container">
        <Button variant="ghost" color="green" onClick={handleNewGame}>
          New Game
        </Button>
        <Button variant="ghost" color="green" onClick={handleLoadGame}>
          Load Game
        </Button>
      </div>
    </div>
  );
};
