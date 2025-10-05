import { useShallow } from 'zustand/react/shallow';

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
        <button className="controlButton" onClick={handleRestOneHour}>
          Rest (1 Hour)
        </button>
        <button className="controlButton primary" onClick={restUntilMorning}>
          Rest Until Morning
        </button>
      </div>
    </footer>
  );
};
