import { useShallow } from 'zustand/shallow';

import { Button } from '@/components/Button/Button';
import { DEFAULT_EXPLORATION_DURATION } from '@/constants';
import textData from '@/locales/en.json';
import { partySelectors, useGameState, worldSelectors } from '@/state/useGameState';
import { TravelManager } from '@/systems/travel/travelManager';

import './LeftPanelFooter.scss';

const SCOUT_BONUS_DURATION = 2;
const SCOUT_BONUS_SCORE = 20;

export const LeftPanelFooter = () => {
  return null;
  const selectedCellId = useGameState((state) => state.map.selectedCellId);

  const { type } = useGameState((state) => state.map.cells[selectedCellId]);
  const currentPartyPosition = useGameState((state) => state.party.currentPartyPosition);
  const partyPerception = useGameState(
    useShallow((state) => partySelectors.selectHighestEffectiveMainStat('per')(state)),
  );
  const isFatigued = useGameState((state) => partySelectors.selectIsPartyFatigued(state));

  const travelToCell = useGameState((state) => state.world.actions.travelToCell);
  const scoutCell = useGameState((state) => state.world.actions.scoutCell);

  const { travelMode } = useGameState((state) => state.party);
  const weather = useGameState((state) => state.world.weather);
  const timeOfDay = useGameState((state) => worldSelectors.selectTimeOfDay(state));

  if (!selectedCellId) return null;

  const travelCost = TravelManager.computeTravelCost({
    currentCellId: currentPartyPosition,
    targetCellId: selectedCellId!,
    terrain: type,
    mode: travelMode,
    weather,
    timeOfDay,
    isFatigued,
  });
  const canScout = currentPartyPosition === selectedCellId;

  const handleMoveClick = () => {
    travelToCell(selectedCellId!);
    console.log('Moving to sector:', selectedCellId);
  };

  const handleScoutClick = () => {
    scoutCell(
      selectedCellId!,
      partyPerception,
      SCOUT_BONUS_SCORE,
      DEFAULT_EXPLORATION_DURATION + SCOUT_BONUS_DURATION,
    );
  };

  return (
    <div className="panelFooter">
      {isFatigued && <div className="fatigueWarning">Party is fatigued!</div>}
      {canScout && (
        <Button variant="solid" color="white" onClick={handleScoutClick}>
          {textData.strategicMap.scoutSector}
        </Button>
      )}
      {travelCost.passable && (
        <Button variant="solid" color="green" onClick={handleMoveClick}>
          <span>
            {textData.strategicMap.travelTo} ({selectedCellId})
          </span>
          <span className="costInfo">
            ({travelCost.minutes} min / {travelCost.stamina} Stamina)
          </span>
        </Button>
      )}
    </div>
  );
};
