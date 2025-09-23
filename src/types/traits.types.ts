// A generic "trait" that can represent anything from a profession to a temporary status effect.
// Its logic is entirely defined by its data, allowing for easy addition/modification.
export type Trait = {
  // --- Core Identification ---
  id: string; // Unique identifier, e.g., "alcoholic1", "medic"
  nameKey: string; // Localization key for the trait's name, e.g., "traits.medic.name"
  descriptionKey: string; // Localization key for the description

  // --- Filtering & Rules ---
  tags?: string[]; // Tags for easy filtering, e.g., ["status"], ["profession"]
  group?: string | null; // Used for mutual exclusion (e.g., you can't have "alcoholic1" and "alcoholic2" at the same time)
  category?: string | null; // Used for limiting the number of traits from a category e.g. "profession"
  maxCategoryCount?: number; // e.g., 2 (allows having a maximum of 2 professions)

  visible?: boolean; // Should this trait be visible to the player in the UI?
  cost?: number; // Cost in creation points (for professions, etc.)
  // --- Duration ---
  // A simple number implies days. For other units, use the object form.
  duration?: number; // | { value: number; unit: 'days' | 'battles' | 'turns' };

  // --- Static Modifiers ---
  // For permanent effects that are always active as long as the trait exists.
  mods?: Record<string, number>; // e.g., { str: -2, dex: +1 }

  // --- Leveling ---
  progress?: number; // Current progress for leveling traits (like professions)
  progressMax?: number; // The value needed to level up

  // --- Dynamic Logic ---
  // Event → List of rules to execute
  triggers?: {
    onDayPass?: TriggerRule[];
    onDayStart?: TriggerRule[];
    onBattleEnd?: TriggerRule[];
    onBattleStart?: TriggerRule[];
    onItemConsume?: TriggerRule[];
    onProgressMax?: TriggerRule[];
    onDurationEnd?: TriggerRule[];
    onAction?: TriggerRule[];
    // ... add more events as needed
  };
};

// A rule consists of optional conditions and mandatory actions.
export type TriggerRule = {
  if?: Condition[]; // All conditions must be met (AND logic)
  do: Action[]; // Executed in order
};

// A condition checks the game state.
export type Condition =
  | { kind: 'hasTag'; tag: string }
  | { kind: 'hasTrait'; id: string }
  | { kind: 'randomChance'; chance: number } // e.g., 0.25 for 25%
  | { kind: 'mainStatCheck'; stat: string; comparison: 'gte' | 'lte'; value: number }; // Stat >= value
// ... add more conditions as needed

type ActionHelper = { chance?: number }; // Optional chance to perform the action
// An action modifies the game state.
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
  | { kind: 'removeGroup'; group: string }
  | { kind: 'setDuration'; id: string; value: number }
  | { kind: 'showToast'; textKey: string } // Uses localization key
  | { kind: 'emitEvent'; event: { type: string; [k: string]: any } }; // For advanced, decoupled logic

export type Action = ActionCore & ActionHelper;

type AddTraitParams = {
  duration?: number | { value: number; unit: 'days' | 'battles' };
  // ... other parameters to pass when creating a new trait instance
};

export type TraitId = string;

export type ActiveTrait = {
  id: TraitId;
  duration?: number;
  progress?: number;

  // денормализованные инварианты из дефиниции (для быстрых проверок/сейва)
  group?: string | null;
  category?: string | null;
  maxCategoryCount?: number | null;
  progressMax?: number | null;

  // кастомное локальное состояние по необходимости (редко)
  // state?: Record<string, any>;
  // на будущее
  // stacks?: number;
};
