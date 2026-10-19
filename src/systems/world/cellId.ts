import type { CellId } from '@/types/ids.types';

/**
 * Работа с ID клеток
 *
 * Id клетки является единственным источником ее координат, поэтому col и row
 * не хранится в авторских данных и вычисляется при инициализации.
 *
 * Формат предполагает неотрицательные координаты.
 * если понадобится поддержка отрицательных координат, формат нужно будет изменить.
 */

const CELL_ID_PATTERN = /^(\d+)-(\d+)$/;

export interface CellCoordinates {
  col: number;
  row: number;
}

export function createCellId(col: number, row: number): CellId {
  return `${col}-${row}` as CellId;
}

/** Бросает исключение при некорректном формате: это ошибка авторских данных */
export function parseCellId(cellId: CellId): CellCoordinates {
  const match = CELL_ID_PATTERN.exec(cellId);
  if (!match) {
    throw new Error(`Invalid cell ID: ${cellId}`);
  }

  return {
    col: Number(match[1]),
    row: Number(match[2]),
  };
}

export function isCellId(value: string): boolean {
  return CELL_ID_PATTERN.test(value);
}
