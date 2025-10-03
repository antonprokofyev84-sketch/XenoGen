import { useShallow } from 'zustand/shallow';

import { DEFAULT_EXPLORATION_DURATION } from '@/constants';
import textData from '@/locales/en.json';
import { areCellsAdjacent } from '@/state/slices/party';
import { partySelectors, useGameStore } from '@/state/useGameState';

import './LeftPanelFooter.scss';

const SCOUT_BONUS_DURATION = 2;
const SCOUT_BONUS_SCORE = 20;

export const LeftPanelFooter = () => {
  const selectedCellId = useGameStore((state) => state.map.selectedCellId);
  const currentPartyPosition = useGameStore((state) => state.party.currentPartyPosition);
  const selectedStat = useGameStore(
    useShallow((state) => partySelectors.selectHighestEffectiveMainStat('per')(state)),
  );
  if (!selectedCellId) return null;
  const travelToCell = useGameStore((state) => state.world.actions.travelToCell);
  const scoutCell = useGameStore((state) => state.world.actions.scoutCell);

  const canMove = areCellsAdjacent(currentPartyPosition, selectedCellId!);
  const canScout = currentPartyPosition === selectedCellId;

  const handleMoveClick = () => {
    travelToCell(selectedCellId!);
    console.log('Moving to sector:', selectedCellId);
  };

  const handleScoutClick = () => {
    scoutCell(
      selectedCellId!,
      selectedStat,
      SCOUT_BONUS_SCORE,
      DEFAULT_EXPLORATION_DURATION + SCOUT_BONUS_DURATION,
    );
  };

  return (
    <div className="panelFooter">
      {canScout && (
        <button className="actionButton scoutButton" onClick={handleScoutClick}>
          {textData.strategicMap.scoutSector}
        </button>
      )}
      {canMove && (
        <button className="actionButton moveButton" onClick={handleMoveClick}>
          {textData.strategicMap.travelTo} ({selectedCellId})
        </button>
      )}
    </div>
  );
};
