export type PoiType =
  | 'battle'
  | 'loot'
  | 'dungeon'
  | 'settlement'
  | 'base'
  | 'event'
  | 'boss'
  | 'quest';

export interface Poi {
  id: string;
  parentId?: string; // id of the parent poi (e.g., settlement for a battle poi)
  poiTemplateId: string;
  nameKey: string;
  descriptionKey: string;
  type: PoiType;

  rarity?: 'common' | 'rare' | 'unique';
  difficulty?: number; // 1-10
  duration?: number; // in days
  progress?: number;
  progressMax?: number;
  faction: string; // faction id

  discovered: boolean;
  perceptionThreshold: number; // минимальное значение восприятия для обнаружения

  triggers?: {
    onDayPass?: TriggerRule[];
    onProgressMax?: TriggerRule[];
  };
}

export type TriggerRule = {
  // if?: Condition[]; // All conditions must be met (AND logic)
  do: Action[]; // Executed in order
};

type ActionHelper = { chance?: number }; // Optional chance to perform the action
// An action modifies the game state.
type ActionCore =
  | { kind: 'modifyProgress'; poiId: string; delta: number }
  | { kind: 'changeCellParam'; cellParam: string; delta: number }
  | { kind: 'changeCellParamInRadius'; cellParam: string; radius: number; delta: number }
  | { kind: 'setProgress'; poiId: string; value: number }
  | { kind: 'replacePoi'; poiId: string; toPoiId: string }
  | { kind: 'addPoi'; poiId: string; params?: Record<string, any> }
  | { kind: 'addPoisInRadius'; poiId: string; radius: number; params?: Record<string, any> }
  | { kind: 'removePoi'; poiId: string };

export type Action = ActionCore & ActionHelper;
