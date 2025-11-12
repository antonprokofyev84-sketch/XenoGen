// --- Rules / Conditions ---
export type TriggerRule = { if?: Condition[]; do: Action[] };

export type Condition =
  | { kind: 'hasTag'; tag: string }
  | { kind: 'hasTrait'; id: string }
  | { kind: 'randomChance'; chance: number }
  | { kind: 'mainStatCheck'; stat: string; comparison: 'gte' | 'lte'; value: number };

// --- Triggers map ---
export type TriggerMap = {
  onDayPass?: TriggerRule[];
  onDayStart?: TriggerRule[];
  onBattleWin?: TriggerRule[];
  onBattleLose?: TriggerRule[];
  onBattleFlee?: TriggerRule[];
  onItemConsume?: TriggerRule[];
  onProgressMax?: TriggerRule[];
  onDurationEnd?: TriggerRule[];
  onAction?: TriggerRule[];
};

// --- Reusable trait fields (used flat or per-level) ---
export type TraitFields = {
  tags?: string[];
  isVisible?: boolean;
  cost?: number;
  duration?: number;
  progress?: number;
  progressMax?: number;
  mods?: Record<string, number>;
  triggers?: TriggerMap;
};

// --- Base template meta ---
export type TraitTemplate = {
  id: string;
  nameKey: string;
  descriptionKey: string;
  category?: string | null;
  maxCategoryCount?: number;
  levels: Record<number, TraitFields>;
};

// --- Actions (unchanged) ---
type ActionHelper = { chance?: number };
type ActionCore =
  | { kind: 'modifyProgress'; id: string; delta: number }
  | { kind: 'setProgress'; id: string; value: number }
  | { kind: 'modifyMainStat'; stat: string; delta: number }
  | { kind: 'setMainStat'; stat: string; value: number }
  | { kind: 'modifySkill'; skill: string; delta: number }
  | { kind: 'setSkill'; skill: string; value: number }
  | { kind: 'addTrait'; id: string; params?: AddTraitParams }
  | { kind: 'removeTrait'; id: string }
  | { kind: 'replaceTrait'; id: string; toId: string }
  | { kind: 'setDuration'; id: string; value: number }
  | { kind: 'showToast'; textKey: string }
  | { kind: 'emitEvent'; event: { type: string; [k: string]: any } }
  | { kind: 'levelUpTrait'; id: string }
  | { kind: 'levelDownTrait'; id: string }
  | { kind: 'setTraitLevel'; id: string; level: number };
export type Action = ActionCore & ActionHelper;

export type AddTraitParams = {
  level?: number;
  duration?: number | { value: number; unit: 'days' | 'battles' | 'turns' };
  progress?: number;
};

// --- Active trait (level optional, as requested) ---
export type TraitId = string;
export type ActiveTrait = {
  id: TraitId;
  level: number;
  duration?: number;
  progress?: number;

  category?: string | null;
  maxCategoryCount?: number | null;
  progressMax?: number | null;
};
