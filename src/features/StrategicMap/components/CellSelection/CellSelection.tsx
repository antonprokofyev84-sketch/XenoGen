import { useGameState } from '@/state/useGameState';

interface CellSelectionProps {
  cellSize: number;
}

export const CellSelection = ({ cellSize }: CellSelectionProps) => {
  const selectedCellId = useGameState((state) => state.map.selectedCellId);
  const travelToCell = useGameState((state) => state.world.actions.travelToCell);

  const handleCellSelectionClick = () => {
    travelToCell(selectedCellId!);
  };

  if (!selectedCellId) {
    return null;
  }

  const [col, row] = selectedCellId.split('-').map(Number);
  const x = col * cellSize;
  const y = row * cellSize;

  //TODO add canMove logic
  return (
    <rect
      className={'selectionFrame canMove'}
      x={x}
      y={y}
      width={cellSize}
      height={cellSize}
      onClick={handleCellSelectionClick}
    />
  );
};
