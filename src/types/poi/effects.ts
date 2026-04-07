/**
 * Эффекты и триггеры для POI.
 * Определяют что происходит с POI когда день проходит, когда пе ходит уровень, и т.д.
 */

export type CellParam = 'threat' | 'prosperity' | 'contamination';

type ActionHelper = { chance?: number };

/**
 * Действие которое может произойти.
 */
type ActionCore =
  | { kind: 'modifySelfProgress'; delta: number }
  | { kind: 'changeCurrentCellParam'; cellParam: CellParam; delta: number }
  | { kind: 'removeSelf' };

export type PoiAction = ActionCore & ActionHelper;

/**
 * Правило триггера: когда может сработать, что делать.
 */
export type PoiTriggerRule = {
  do: PoiAction[];
};

/**
 * Триггеры для POI — что происходит когда день проходит и т.д.
 */
export type PoiTemplateTriggers = {
  onDayPass?: PoiTriggerRule[];
};

/**
 * Перегруппировка всех эффектов по типам POI.
 */
export type EffectsMap = Record<string, PoiTriggerRule[]>;
