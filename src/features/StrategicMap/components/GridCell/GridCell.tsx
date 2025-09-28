import React from 'react';

import { useShallow } from 'zustand/react/shallow';

import { mapSelectors } from '@/state/slices/map';
import { useGameStore } from '@/state/useGameState';

interface GridCellProps {
  col: number;
  row: number;
  cellSize: number;
}

export const GridCell = React.memo(function GridCell({ col, row, cellSize }: GridCellProps) {
  const cellId = `${col}-${row}`;

  const cellData = useGameStore(useShallow(mapSelectors.selectCellById(cellId)));
  const cellIcon = useGameStore(useShallow(mapSelectors.selectCellIcon(cellId)));

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
    <>
      <rect
        className={getCellClass()}
        x={col * cellSize}
        y={row * cellSize}
        width={cellSize}
        height={cellSize}
      />
      {cellIcon && (
        <use
          href={`#icon-${cellIcon}`}
          x={col * cellSize + cellSize / 4}
          y={row * cellSize + cellSize / 4}
          width={cellSize / 2}
          height={cellSize / 2}
          fill="currentColor"
        />
      )}
    </>
  );
});
