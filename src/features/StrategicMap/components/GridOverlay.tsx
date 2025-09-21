import React from 'react';
import './GridOverlay.scss';

const GRID_COLS = 20;
const GRID_ROWS = 20;
const CELL_SIZE = 50;

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

  return (
    <svg className="gridOverlay" width={mapWidth} height={mapHeight} onClick={handleMapClick}>
      {Array.from({ length: GRID_ROWS }).map((_, row) =>
        Array.from({ length: GRID_COLS }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            className="gridCell"
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
