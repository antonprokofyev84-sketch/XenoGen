import { useGameState } from '@/state/useGameState';
import { useMapInteractionStore } from '@/state/useMapInteractionStore';

interface CellSelectionProps {
  cellSize: number;
  readOnly?: boolean;
}

export const CellSelection = ({ cellSize, readOnly = false }: CellSelectionProps) => {
  const focusedCellId = useMapInteractionStore((state) => state.focusedPoiId);
  const travelToPoi = useGameState((state) => state.world.actions.travelToPoi);

  const handleCellSelectionClick = () => {
    travelToPoi(focusedCellId!);
  };

  if (!focusedCellId) {
    return null;
  }

  const [col, row] = focusedCellId.split('-').map(Number);
  const x = col * cellSize;
  const y = row * cellSize;

  //TODO add canMove logic
  return (
    <rect
      className={`selectionFrame${readOnly ? '' : ' canMove'}`}
      x={x}
      y={y}
      width={cellSize}
      height={cellSize}
      onClick={readOnly ? undefined : handleCellSelectionClick}
    />
  );
};
