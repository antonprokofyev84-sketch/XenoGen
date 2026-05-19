import { Button } from '@/components/Button/Button';
import { DEFAULT_EXPLORATION_DURATION } from '@/constants';
import textData from '@/locales/en.json';
import { partySelectors, poiSelectors, useGameState } from '@/state/useGameState';
import { useMapInteractionStore } from '@/state/useMapInteractionStore';
import { TravelManager } from '@/systems/travel/travelManager';

import './LeftPanelFooter.scss';

const SCOUT_BONUS_DURATION = 2;
const SCOUT_BONUS_SCORE = 20;

export const LeftPanelFooter = () => {
  const focusedPoiId = useMapInteractionStore((state) => state.focusedPoiId);
  const currentPartyPosition = useGameState((state) => state.party.currentPartyPosition);
  const selectedCellId = focusedPoiId ?? currentPartyPosition;

  const selectedCell = useGameState(poiSelectors.selectPoiById(selectedCellId));
  const partyPerception = useGameState((state) =>
    partySelectors.selectHighestEffectiveMainStat('per')(state),
  );
  const isFatigued = useGameState((state) => partySelectors.selectIsPartyFatigued(state));

  const travelToPoi = useGameState((state) => state.world.actions.travelToPoi);
  const scoutCell = useGameState((state) => state.world.actions.scoutCell);

  const travelCost = useGameState((state) => {
    if (!selectedCellId || !selectedCell || selectedCell.type !== 'cell') {
      return { canTravel: false, staminaCost: Infinity, timeCost: Infinity };
    }

    return TravelManager.computeTravel(currentPartyPosition, selectedCellId, state);
  });

  if (!selectedCell || selectedCell.type !== 'cell') {
    return null;
  }

  const canScout = currentPartyPosition === selectedCellId;
  const canMove = currentPartyPosition !== selectedCellId && travelCost.canTravel;

  const handleMoveClick = () => {
    travelToPoi(selectedCellId);
  };

  const handleScoutClick = () => {
    scoutCell(
      selectedCellId,
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

      {canMove && (
        <Button variant="solid" color="green" onClick={handleMoveClick}>
          <span>
            {textData.strategicMap.travelTo} ({selectedCellId})
          </span>
          <span className="costInfo">
            ({travelCost.timeCost} min / {travelCost.staminaCost} Stamina)
          </span>
        </Button>
      )}
    </div>
  );
};
