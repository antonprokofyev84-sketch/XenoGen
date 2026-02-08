import React, { useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { factionsSelectors, poiSelectors, useGameState } from '@/state/useGameState';
import { useMapInteractionStore } from '@/state/useMapInteractionStore';

import { resolveCellIcon } from './resolveCellIcon';

interface GridCellProps {
  col: number;
  row: number;
  cellSize: number;
}

export const GridCell = React.memo(function GridCell({ col, row, cellSize }: GridCellProps) {
  const cellPoiId = `${col}-${row}`;

  // --- cell POI ---
  const cellPoi = useGameState(
    useShallow((state) => {
      const poi = state.poiSlice.pois[cellPoiId];
      return poi && poi.type === 'cell' ? poi : null;
    }),
  );

  const discoveredChildren = useGameState(
    useShallow(poiSelectors.selectDiscoveredChildrenOfPoi(cellPoiId)),
  );

  const partyPosition = useGameState((state) => state.party.currentPartyPosition);
  const focusedCellId = useMapInteractionStore((state) => state.focusedPoiId);

  const isFocused = focusedCellId === cellPoiId;

  // --- icon resolve ---
  const cellIcon = useMemo(() => {
    if (partyPosition === cellPoiId) {
      return { icon: 'party', faction: 'player' };
    }
    return resolveCellIcon(discoveredChildren);
  }, [partyPosition, cellPoiId, discoveredChildren]);

  const iconStatus = useGameState(
    useShallow(factionsSelectors.selectStatus(cellIcon?.faction || 'neutral')),
  );

  // --- cell class ---
  const cellClass = useMemo(() => {
    if (!cellPoi || cellPoi.details.visitedTimes === 0) {
      return 'unexplored';
    }

    if (cellPoi.details.explorationDaysLeft === null || cellPoi.details.explorationDaysLeft > 0) {
      return 'explored';
    }

    return 'visited';
  }, [cellPoi]);

  if (!cellPoi) {
    console.warn(`GridCell: No cell POI found for cellId ${cellPoiId}`);
  }

  const x = col * cellSize;
  const y = row * cellSize;
  const iconOffset = cellSize / 4;
  const iconSize = cellSize / 2;

  return (
    <>
      <rect
        className={`gridCell ${cellClass} ${isFocused ? 'focused' : ''}`}
        x={x}
        y={y}
        width={cellSize}
        height={cellSize}
      />
      {cellIcon && (
        <use
          href={`#icon-${cellIcon.icon}`}
          x={x + iconOffset}
          y={y + iconOffset}
          width={iconSize}
          height={iconSize}
          className={iconStatus}
          fill="currentColor"
        />
      )}
    </>
  );
});
