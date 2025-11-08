import React from 'react';

import { CELL_SIZE, GRID_COLS, GRID_ROWS } from '@/constants';
import { useGameState } from '@/state/useGameState';

import { CellSelection } from '../CellSelection/CellSelection';
import { GridCell } from '../GridCell/GridCell';
import { MapIconDefs } from '../MapIconDefs/MapIconDefs';

import './GridOverlay.scss';

interface GridOverlayProps {}

export const GridOverlay: React.FC<GridOverlayProps> = () => {
  const setSelectedCellId = useGameState((state) => state.map.actions.setSelectedCellId);
  const mapWidth = GRID_COLS * CELL_SIZE;
  const mapHeight = GRID_ROWS * CELL_SIZE;

  const handleMapClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - svgRect.left;
    const y = event.clientY - svgRect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    console.log(`Clicked sector coordinates: (${col}, ${row})`);

    setSelectedCellId(`${col}-${row}`);
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
      <MapIconDefs />

      {Array.from({ length: GRID_ROWS }).map((_, row) =>
        Array.from({ length: GRID_COLS }).map((_, col) => (
          <GridCell key={`${row}-${col}`} row={row} col={col} cellSize={CELL_SIZE} />
        )),
      )}
      <CellSelection cellSize={CELL_SIZE} />
    </svg>
  );
};
