import type { InitialCellList } from '@/types/cellContent.types';
import type { CellId } from '@/types/ids.types';

import { FIXTURE_CELLS } from './fixtures/cells.fixture';

/**
 * Initial клетки фиксированной карты.
 *
 * Сейчас содержит только технические фикстуры: старый контент не
 * переносится, а игровой появится после завершения миграции.
 */
export const INITIAL_CELLS: InitialCellList = [...FIXTURE_CELLS];

/** Клетка в которой партия начинает новую игру */
export const START_CELL_ID: CellId = '0-0';
