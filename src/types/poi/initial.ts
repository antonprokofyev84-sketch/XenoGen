/**
 * Initial POI данные - для seed/инициализации игры.
 */
import type { InitialCellPoiNode } from './cell';
import type { InitialBasePoiNode } from './common';
import type { UniversalPoiDetails } from './nodes';

export interface InitialNonCellPoiNode extends InitialBasePoiNode {
  type: string;
  parentId: string;
  isLocalSpot?: boolean;
  details: Partial<UniversalPoiDetails> & Record<string, any>;
}

/**
 * Союз всех initial POI типов.
 */
export type InitialPoi = InitialCellPoiNode | InitialNonCellPoiNode;
