import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/Button/Button';
import { useGameState } from '@/state/useGameState';

import { TimeDisplay } from '../TimeDisplay/TimeDisplay';

import './BottomBar.scss';

export const BottomBar = () => {
  const { restForMinutes, restUntilMorning } = useGameState(
    useShallow((state) => state.world.actions),
  );
  const goToScreen = useGameState((state) => state.ui.goToScreen);

  // const { stamina } = useGameState((state) => state.characters.byId['protagonist']);

  const handleRestOneHour = () => {
    restForMinutes(60);
  };

  return (
    <footer className="bottomBar">
      <div className="timeSection">
        <TimeDisplay />
      </div>

      <div className="partyPortraits">
        <Button variant="solid" color="white" onClick={() => goToScreen('characterDetails')}>
          Character Details
        </Button>
      </div>

      <div className="controls">
        <Button variant="solid" color="white" onClick={handleRestOneHour}>
          Rest (1 Hour)
        </Button>
        <Button variant="solid" color="red" onClick={restUntilMorning}>
          Rest Until Morning
        </Button>
      </div>
    </footer>
  );
};
