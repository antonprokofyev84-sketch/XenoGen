export type PoiType =
  | 'battle'
  | 'loot'
  | 'dungeon'
  | 'settlement'
  | 'base'
  | 'event'
  | 'boss'
  | 'quest';

export interface Poi extends ActivePoi {
  nameKey: string;
  descriptionKey: string;

  triggers?: {
    onDayPass?: PoiTriggerRule[];
    onProgressMax?: PoiTriggerRule[];
  };
}

export interface ActivePoi {
  id: string;
  poiTemplateId: string;
  type: PoiType;
  rarity?: 'common' | 'rare' | 'unique';
  difficulty?: number;
  duration?: number;
  progress?: number;
  progressMax?: number;
  faction: string;
  isDiscovered: boolean;
  perceptionThreshold: number;
}

export type PoiTriggerRule = {
  // if?: Condition[]; // All conditions must be met (AND logic)
  do: PoiAction[]; // Executed in order
};

type ActionHelper = { chance?: number }; // Optional chance to perform the action

type ActionCore =
  | { kind: 'modifySelfProgress'; delta: number }
  | { kind: 'setSelfProgress'; value: number }
  | { kind: 'changeCurrentCellParam'; cellParam: string; delta: number }
  | {
      kind: 'changeCellParamInRadius';
      cellParam: string;
      delta: number;
      radius: number;
      perCellChance?: number;
    }
  | { kind: 'replaceSelf'; toPoiId: string }
  | { kind: 'addPoiToCurrentCell'; poiId: string; params?: Record<string, any> }
  | {
      kind: 'addPoisInRadius';
      poiId: string;
      params?: Record<string, any>;
      radius: number;
      perCellChance?: number;
    };
// | { kind: 'removePoi'; poiId: string };

export type PoiAction = ActionCore & ActionHelper;

export type EffectsMap = Record<string, PoiTriggerRule[]>;
