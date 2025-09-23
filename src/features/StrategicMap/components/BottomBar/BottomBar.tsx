import { useGameStore } from '@/state/useGameState';
import { playerSelectors } from '@/state/useGameState';
import './BottomBat.scss';

export const BottomBar = () => {
  const endDay = useGameStore((state) => state.world.actions.endDay);
  const heroId = useGameStore(playerSelectors.id);
  const traits = useGameStore((state) => state.traits.traitsByCharacterId[heroId]);

  const handleEndDayClick = () => {
    endDay();
  };

  return (
    <footer className="bottomBar">
      <div className="partyPortraits">{/* Заглушка для портретов группы */}</div>

      <div className="controls">
        <button className="endDayButton" onClick={handleEndDayClick}>
          End Day
        </button>
      </div>

      <div className="resources">{/* Заглушка для отображения ресурсов */}</div>
    </footer>
  );
};
