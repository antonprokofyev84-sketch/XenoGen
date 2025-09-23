import { useGameStore } from '@/state/useGameState';
import { mapSelectors } from '@/state/slices/map';
import { useShallow } from 'zustand/react/shallow';

interface GridCellProps {
  col: number;
  row: number;
  cellSize: number;
}

export const GridCell = ({ col, row, cellSize }: GridCellProps) => {
  const cellId = `${col}-${row}`;

  const cellData = useGameStore(useShallow(mapSelectors.selectCellById(cellId)));

  const getCellClass = () => {
    if (!cellData || !cellData.visited) {
      return 'gridCell unexplored';
    }

    if (
      cellData.explorationDaysLeft === null ||
      (cellData.explorationDaysLeft && cellData.explorationDaysLeft > 0)
    ) {
      return 'gridCell explored';
    }

    return 'gridCell visited';
  };

  return (
    <rect
      className={getCellClass()}
      x={col * cellSize}
      y={row * cellSize}
      width={cellSize}
      height={cellSize}
    />
  );
};
