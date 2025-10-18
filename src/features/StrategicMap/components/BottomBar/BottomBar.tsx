import { useShallow } from 'zustand/react/shallow';

import { Button } from '@/components/Button/Button';
import { useGameStore } from '@/state/useGameState';

import { TimeDisplay } from '../TimeDisplay/TimeDisplay';

import './BottomBar.scss';

export const BottomBar = () => {
  const { restForMinutes, restUntilMorning } = useGameStore(
    useShallow((state) => state.world.actions),
  );

  const { stamina } = useGameStore((state) => state.characters.byId['protagonist']);

  const handleRestOneHour = () => {
    restForMinutes(60);
  };

  return (
    <footer className="bottomBar">
      <div className="timeSection">
        <TimeDisplay />
      </div>

      <div className="partyPortraits">{stamina}</div>

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
