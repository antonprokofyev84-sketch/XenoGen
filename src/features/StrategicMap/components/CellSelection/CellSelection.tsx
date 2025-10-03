import { areCellsAdjacent } from '@/state/slices/party';
import { useGameStore } from '@/state/useGameState';

interface CellSelectionProps {
  cellSize: number;
}

export const CellSelection = ({ cellSize }: CellSelectionProps) => {
  const selectedCellId = useGameStore((state) => state.map.selectedCellId);
  const currentPartyPosition = useGameStore((state) => state.party.currentPartyPosition);
  const travelToCell = useGameStore((state) => state.world.actions.travelToCell);

  const canMove = selectedCellId && areCellsAdjacent(currentPartyPosition, selectedCellId!);

  const handleCellSelectionClick = () => {
    if (canMove) {
      travelToCell(selectedCellId!);
    }
  };

  if (!selectedCellId) {
    return null;
  }

  const [col, row] = selectedCellId.split('-').map(Number);
  const x = col * cellSize;
  const y = row * cellSize;

  return (
    <rect
      className={`selectionFrame ${canMove ? 'canMove' : ''}`}
      x={x}
      y={y}
      width={cellSize}
      height={cellSize}
      onClick={handleCellSelectionClick}
    />
  );
};
