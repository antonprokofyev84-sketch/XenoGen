import { mapSelectors } from '@/state/slices/map';
import { useGameStore } from '@/state/useGameState';

interface CellSelectionProps {
  cellSize: number;
}

export const CellSelection = ({ cellSize }: CellSelectionProps) => {
  const selectedCellId = useGameStore(mapSelectors.selectSelectedCellId);

  if (!selectedCellId) {
    return null;
  }

  const [col, row] = selectedCellId.split('-').map(Number);
  const x = col * cellSize;
  const y = row * cellSize;

  return <rect className="selectionFrame" x={x} y={y} width={cellSize} height={cellSize} />;
};
