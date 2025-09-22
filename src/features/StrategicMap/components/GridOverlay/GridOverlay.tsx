import React from 'react';
import './GridOverlay.scss';
import { MAP_DB } from '@/data/map.data';

const GRID_COLS = 10;
const GRID_ROWS = 10;
const CELL_SIZE = 100; // pixels

export const GridOverlay = () => {
  const mapWidth = GRID_COLS * CELL_SIZE;
  const mapHeight = GRID_ROWS * CELL_SIZE;

  const handleMapClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    console.log(`Clicked sector coordinates: (${col}, ${row})`);
  };

  const getCellClass = (col: number, row: number) => {
    const cellId = `${col}-${row}`;
    const cellData = MAP_DB[cellId];
    if (!cellData.visited) {
      return 'gridCell unexplored';
    } else if (cellData.explorationDaysLeft === null || cellData.explorationDaysLeft > 0) {
      return 'gridCell explored';
    }
    return 'gridCell visited';
  };

  return (
    <svg className="gridOverlay" width={mapWidth} height={mapHeight} onClick={handleMapClick}>
      <defs>
        <pattern
          id="scoutHatch"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="8" height="8" fill="transparent" />

          <rect x="0" y="0" width="2" height="8" fill="rgba(255,255,255,0.15)" />
        </pattern>
      </defs>

      {Array.from({ length: GRID_ROWS }).map((_, row) =>
        Array.from({ length: GRID_COLS }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            className={getCellClass(col, row)}
            x={col * CELL_SIZE}
            y={row * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
          />
        )),
      )}
    </svg>
  );
};
