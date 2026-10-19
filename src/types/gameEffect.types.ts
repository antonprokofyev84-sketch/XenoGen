import type { QuestVarValue } from './condition.types';
import type { EnemyTypeId, ItemId, PoiId, QuestId, QuestStageId } from './ids.types';
import type { ChangeRegionParameterEffect } from './region.types';

/**
 * Каталог effects первой версии.
 *
 * Union намеренно закрыт: в него входят утверждённые quest effects,
 * структурные effects, узкий `modifyTension` для `forceExit`, партийная
 * stamina и rewards инвентаря протагониста. Остальные социальные, stat/skill
 * и arbitrary-target inventory effects добавляются только под конкретный
 * принятый сценарий.
 *
 * Все варианты используют общий discriminator `type`.
 */

/** Цель эффектов, адресующих POI: конкретный экземпляр либо текущий. */
export const CURRENT_POI_TARGET = '$currentPoi';

export type PoiEffectTarget = PoiId | typeof CURRENT_POI_TARGET;

// ============================================================
// Quest effects
// ============================================================

export interface SetQuestStageEffect {
  type: 'setQuestStage';
  questId: QuestId;
  stageId: QuestStageId;
}

export interface SetQuestVarEffect {
  type: 'setQuestVar';
  questId: QuestId;
  key: string;
  value: QuestVarValue;
}

/** Сохраняет текущее число побед над типом врага как baseline квестовой переменной. */
export interface SnapshotDefeatedCountEffect {
  type: 'snapshotDefeatedCount';
  questId: QuestId;
  key: string;
  enemyTypeId: EnemyTypeId;
}

export interface SetQuestJournalVisibilityEffect {
  type: 'setQuestJournalVisibility';
  questId: QuestId;
  isVisible: boolean;
}

export interface CompleteQuestEffect {
  type: 'completeQuest';
  questId: QuestId;
}

export interface FailQuestEffect {
  type: 'failQuest';
  questId: QuestId;
}

export type QuestEffect =
  | SetQuestStageEffect
  | SetQuestVarEffect
  | SnapshotDefeatedCountEffect
  | SetQuestJournalVisibilityEffect
  | CompleteQuestEffect
  | FailQuestEffect;

/** Lifecycle-эффекты: в одном блоке `effects` допустим максимум один на квест. */
export type QuestLifecycleEffect = SetQuestStageEffect | CompleteQuestEffect | FailQuestEffect;

const QUEST_LIFECYCLE_EFFECT_TYPES: readonly QuestLifecycleEffect['type'][] = [
  'setQuestStage',
  'completeQuest',
  'failQuest',
];

export function isQuestLifecycleEffect(effect: Effect): effect is QuestLifecycleEffect {
  return (QUEST_LIFECYCLE_EFFECT_TYPES as readonly string[]).includes(effect.type);
}

// ============================================================
// Structural effects
// ============================================================

/**
 * Рекурсивно помечает текущий POI и всех его потомков на удаление.
 * Физическое удаление выполняется одним общим проходом в конце дня.
 */
export interface MarkCurrentPoiForRemovalEffect {
  type: 'markCurrentPoiForRemoval';
}

/** Временная блокировка входа: устанавливает `entryDisabledDaysLeft`. */
export interface DisablePoiEntryForDaysEffect {
  type: 'disablePoiEntryForDays';
  poiId: PoiEffectTarget;
  /** Положительное целое. `1` означает блокировку до ближайшего конца дня. */
  days: number;
}

/** Постоянная блокировка входа: устанавливает либо снимает `isEntryDisabled`. */
export interface SetPoiEntryDisabledEffect {
  type: 'setPoiEntryDisabled';
  poiId: PoiEffectTarget;
  isDisabled: boolean;
}

// ============================================================
// Interaction and party effects
// ============================================================

/**
 * Изменение дневного tension текущего NPC.
 *
 * Требует slot/NPC-контекст: у POI собственного tension нет.
 * Достижение порога планирует system `forceExit`.
 */
export interface ModifyTensionEffect {
  type: 'modifyTension';
  delta: number;
}

/**
 * Изменение партийного пула stamina.
 *
 * Это единственный способ восстановить stamina действием: `cost.time` сам по
 * себе её не восстанавливает. Личная stamina протагониста расходуется через
 * `cost.stamina` и с партийным пулом не смешивается.
 */
export interface ModifyPartyStaminaEffect {
  type: 'modifyPartyStamina';
  delta: number;
}

// ============================================================
// Protagonist inventory rewards
// ============================================================

export interface AddMoneyEffect {
  type: 'addMoney';
  amount: number;
}

export interface AddItemEffect {
  type: 'addItem';
  itemId: ItemId;
  count: number;
}

export interface RemoveItemEffect {
  type: 'removeItem';
  itemId: ItemId;
  count: number;
}

// ============================================================
// Union
// ============================================================

export type Effect =
  | QuestEffect
  | ChangeRegionParameterEffect
  | MarkCurrentPoiForRemovalEffect
  | DisablePoiEntryForDaysEffect
  | SetPoiEntryDisabledEffect
  | ModifyTensionEffect
  | ModifyPartyStaminaEffect
  | AddMoneyEffect
  | AddItemEffect
  | RemoveItemEffect;
