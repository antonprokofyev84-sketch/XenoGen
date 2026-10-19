import type { InitialPoisByCell } from '@/types/poiContent.types';

import { FIXTURE_POIS_BY_CELL } from './fixtures/pois.fixture';

/**
 * Initial POI, сгруппированные по корневой клетке.
 *
 * Ключ группы задаёт `rootCellId`, поэтому в самих записях он не хранится.
 * Пустые группы клеток не указываются.
 */
export const INITIAL_POIS_BY_CELL: InitialPoisByCell = { ...FIXTURE_POIS_BY_CELL };
