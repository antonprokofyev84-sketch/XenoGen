/**
 * Generic POI - для всех типов которых ещё нет специфичных деталей.
 * Включает: loot, dungeon, settlement, base, boss, quest
 */
import type { BasePoiNode, InitialBasePoiNode, PoiType } from './common';

// ============================================================
// RUNTIME DETAILS
// ============================================================

export interface GenericPoiNode extends BasePoiNode {
  type: 'loot' | 'dungeon' | 'settlement' | 'base' | 'boss' | 'quest';
  details: Record<string, any>;
}

// ============================================================
// TEMPLATE DETAILS
// ============================================================

export type GenericTemplateDetails = Record<string, any>;

// ============================================================
// INITIAL DETAILS
// ============================================================

export interface InitialGenericPoiNode extends InitialBasePoiNode {
  type: Exclude<PoiType, 'cell' | 'encounter' | 'facility' | 'spot'>;
  parentId: string;
  details: Record<string, any>;
}
