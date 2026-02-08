import type { EncounterDetails } from './poi.types';

/* =====================
   Template detail types
===================== */

/**
 * Encounter template details:
 * то же, что EncounterDetails,
 * но faction необязательная
 */
export type EncounterTemplateDetails = Omit<EncounterDetails, 'faction'> & {
  faction?: string;
};

/**
 * Generic template details
 * (пока для всех не-encounter POI)
 */
export type GenericTemplateDetails = Record<string, any>;

/**
 * Мапа: тип POI -> тип деталей template
 * cell намеренно отсутствует
 */
export type PoiTemplateDetailsByType = {
  encounter: EncounterTemplateDetails;
  loot: GenericTemplateDetails;
  facility: GenericTemplateDetails;
  dungeon: GenericTemplateDetails;
  settlement: GenericTemplateDetails;
  base: GenericTemplateDetails;
  boss: GenericTemplateDetails;
  quest: GenericTemplateDetails;
};

/**
 * Типы POI, которые могут иметь template
 */
export type TemplatePoiType = keyof PoiTemplateDetailsByType;

export type PoiTemplateTriggers = {
  onDayPass?: PoiTriggerRule[];
  // onProgressMax?: PoiTriggerRule[];
  // onProgressMin?: PoiTriggerRule[];
};

/* =====================
   Template levels
===================== */

export type PoiTemplateLevel<T extends TemplatePoiType> = {
  details?: Partial<PoiTemplateDetailsByType[T]>;
  triggers?: PoiTemplateTriggers;
};

/* =====================
   Base template type
===================== */

export type PoiTemplate<T extends TemplatePoiType = TemplatePoiType> = {
  type: T;
  details: Partial<PoiTemplateDetailsByType[T]>;
  triggers?: PoiTemplateTriggers;
  levels?: Record<number, PoiTemplateLevel<T>>;
};

/* =====================
   Union of all templates
===================== */

export type AnyPoiTemplate =
  | PoiTemplate<'encounter'>
  | PoiTemplate<'loot'>
  | PoiTemplate<'facility'>
  | PoiTemplate<'dungeon'>
  | PoiTemplate<'settlement'>
  | PoiTemplate<'base'>
  | PoiTemplate<'boss'>
  | PoiTemplate<'quest'>;

type ActionHelper = { chance?: number }; // Optional chance to perform the action

export type CellParam = 'threat' | 'prosperity' | 'contamination';

type ActionCore =
  // | { kind: 'levelUpSelf' }
  // | { kind: 'levelDownSelf' }
  | { kind: 'modifySelfProgress'; delta: number }
  // | { kind: 'setSelfProgress'; value: number }
  | { kind: 'changeCurrentCellParam'; cellParam: CellParam; delta: number }
  // | {
  //     kind: 'changeCellParamInRadius';
  //     cellParam: string;
  //     delta: number;
  //     radius: number;
  //     perCellChance?: number;
  //   }
  | { kind: 'removeSelf' };
// | { kind: 'replaceSelf'; toPoiId: string }
// | { kind: 'addPoiToCurrentCell'; poiId: string; params?: Record<string, any> }
// | {
//     kind: 'addPoisInRadius';
//     poiId: string;
//     params?: Record<string, any>;
//     radius: number;
//     perCellChance?: number;
//   };

export type PoiAction = ActionCore & ActionHelper;

export type PoiTriggerRule = {
  // if?: Condition[]; // All conditions must be met (AND logic)
  do: PoiAction[]; // Executed in order
};

export type EffectsMap = Record<string, PoiTriggerRule[]>;
