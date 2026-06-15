import type { InteractionService } from './interaction.types';

// ============================================================
// BASE PRIMITIVES
// ============================================================

export type CellTerrain = 'forest' | 'mountain' | 'plain' | 'desert' | 'water' | 'ruins';

/** 'cell' is the only special sentinel; all other values are content keys (template ids). */
export type PoiType = 'cell' | string;

export interface GeneralDetails {
  lastTimeVisited?: number | null;
  visitedTimes?: number;
}

export interface BasePoiNode {
  id: string;
  parentId: string | null;
  isLocalSpot?: boolean;
  nestedPoiIds: string[];
  localSpotIds: string[];
  rootCellId: string;
}

export type InitialBasePoiNode = Omit<BasePoiNode, 'nestedPoiIds' | 'localSpotIds'>;

// ============================================================
// REGION PARAMETERS
// ============================================================

export interface RegionParameters {
  threat: number;
  prosperity: number;
  contamination: number;
  techLevel: number;
}

// ============================================================
// CELL NODE
// ============================================================

export interface CellDetails extends GeneralDetails {
  col: number;
  row: number;
  terrain: CellTerrain;
  regionParameters: RegionParameters;
  visitedTimes: number;
  explorationLevel: number;
  /**
   * 0     -> not currently scouted
   * > 0   -> scouted for N more days or permanently (Infinity)
   */
  explorationDaysLeft: number;
}

export interface CellPoiNode extends BasePoiNode {
  type: 'cell';
  details: CellDetails;
}

export type InitialCellDetails = Pick<CellDetails, 'col' | 'row' | 'terrain'> &
  Partial<Omit<CellDetails, 'col' | 'row' | 'terrain'>>;

export interface InitialCellPoiNode extends InitialBasePoiNode {
  type: 'cell';
  parentId: null;
  details: InitialCellDetails;
}

// ============================================================
// NON-CELL NODE
// ============================================================

export interface UniversalPoiDetails extends GeneralDetails {
  isDiscovered: boolean;
  explorationThreshold: number;
  faction?: string;
  lifetimeDays?: number | null;
  /** Overrides specific region parameters for this POI, relative to the root cell. */
  regionParameters?: Partial<RegionParameters>;
  /** Additive modifiers applied on top of the resolved override. Clamped to 0 minimum. */
  regionParameterModifiers?: Partial<RegionParameters>;
}

export interface PoiNpcPlacement {
  purpose: 'work' | 'free_time';
  allowedNpcIds: string[];
  requiresOccupant?: boolean;
}

/** `type` is the template/content key (e.g. "scavenger_group"). */
export interface NonCellPoiNode extends BasePoiNode {
  type: string;
  details: UniversalPoiDetails;
  npcPlacement?: PoiNpcPlacement;
}

// ============================================================
// INITIAL / SEED TYPES
// ============================================================

export interface InitialNonCellPoiNode extends InitialBasePoiNode {
  type: string;
  parentId: string;
  isLocalSpot?: boolean;
  details: Partial<UniversalPoiDetails> & Record<string, any>;
  npcPlacement?: PoiNpcPlacement;
}

export type InitialPoi = InitialCellPoiNode | InitialNonCellPoiNode;

// ============================================================
// UNIONS
// ============================================================

export type PoiNode = CellPoiNode | NonCellPoiNode;

export type NonCellNode = NonCellPoiNode;

export type PoiDetails = PoiNode['details'];

// ============================================================
// TYPE GUARDS
// ============================================================

export function isCell(poi: PoiNode): poi is CellPoiNode {
  return poi.type === 'cell';
}

export function isNonCell(poi: PoiNode): poi is NonCellPoiNode {
  return poi.type !== 'cell';
}

// ============================================================
// EFFECTS & TRIGGERS
// ============================================================

export type CellParam = 'threat' | 'prosperity' | 'contamination' | 'techLevel';

type ActionHelper = { chance?: number };

type ActionCore =
  | { kind: 'changeCurrentCellParam'; cellParam: CellParam; delta: number }
  | { kind: 'removeSelf' };

export type PoiAction = ActionCore & ActionHelper;

export type PoiTriggerRule = {
  do: PoiAction[];
};

export type PoiTemplateTriggers = {
  onDayPass?: PoiTriggerRule[];
};

export type EffectsMap = Record<string, PoiTriggerRule[]>;

// ============================================================
// TEMPLATE
// ============================================================

export type PoiTemplate = {
  /** If true, the created node will be auto-marked isLocalSpot=true. */
  isLocalSpot?: boolean;
  details: Partial<UniversalPoiDetails> & Record<string, any>;
  npcPlacement?: PoiNpcPlacement;
  services?: InteractionService[];
  triggers?: PoiTemplateTriggers;
};
