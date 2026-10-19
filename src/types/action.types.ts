import type { MainStatKey, SkillKey } from './character.types';
import type { LocalizedText } from './common.types';
import type { ActionCondition, QuestVarValue } from './condition.types';
import type { Effect } from './gameEffect.types';
import type { FrameId, ItemId, NpcId, PoiId, QuestId, SlotId } from './ids.types';
import type { NarrativeBlock } from './narrativeBlock.types';
import type { RegionLevels } from './region.types';

/**
 * Контракт авторских Actions.
 *
 * Action описывает выбор игрока и его результат. Initial Action не содержит
 * счётчиков выполнений, сохранённых бросков, текущего Frame или NPC: всё это
 * принадлежит runtime-памяти. Функции Action не мутируют store.
 */

// ============================================================
// Read context
// ============================================================

/**
 * Курируемый read-only facade для числовых функций контента.
 *
 * Context-функции намеренно не получают сырой `StoreState` и не читают
 * произвольные slices: это развязывает контент с формой store. Facade
 * начинается минимальным и расширяется явным полем, когда реальный контент
 * показывает недостающее значение.
 */
export interface ActionContext {
  readonly poiId: PoiId;
  readonly slotId?: SlotId;
  readonly npcId?: NpcId;
  readonly frameId: FrameId;

  /** Итоговые уровни `0..9` текущего POI. */
  readonly regionLevels: Readonly<RegionLevels>;

  readonly currentNpcAffection?: number;
  readonly effectiveRelation?: number;
  readonly tension?: number;

  readonly getQuestVar: (questId: QuestId, key: string) => QuestVarValue | undefined;
}

/**
 * Число, которое может зависеть от состояния игры.
 *
 * Функция читает переданный контекст, возвращает число, не мутирует store и
 * не бросает случайность самостоятельно: бросок выполняет executor.
 */
export type ActionNumber = number | ((context: ActionContext) => number);

// ============================================================
// Limits and cost
// ============================================================

export interface ExecutionLimit {
  /** Число начатых попыток за игровой день; счётчик очищается в конце дня. */
  perDay?: number;
  /** Общее число начатых попыток за игру; в конце дня не очищается. */
  total?: number;
}

export interface ActionItemCost {
  itemId: ItemId;
  count: ActionNumber;
}

/**
 * Обязательные затраты попытки.
 *
 * `cost` — единственный источник обязательных затрат: одну и ту же плату не
 * нужно описывать условием наличия и эффектом списания. Если ресурсов
 * недостаточно, Action disabled и попытка не начинается.
 */
export interface ActionCost {
  money?: ActionNumber;
  /** Личная stamina протагониста, а не партийный пул. */
  stamina?: ActionNumber;
  /** Минуты игрового времени. Сами по себе stamina не восстанавливают. */
  time?: ActionNumber;
  items?: ActionItemCost[];
}

// ============================================================
// Transitions
// ============================================================

export type ActionTransition =
  | { type: 'frame'; frameId: FrameId }
  | { type: 'root' }
  | { type: 'currentPoi' }
  | { type: 'parentPoi' }
  | { type: 'poi'; poiId: PoiId }
  | { type: 'trade' }
  | { type: 'combat' };

// ============================================================
// Results
// ============================================================

export interface ActionResult {
  narrative?: NarrativeBlock[];
  effects?: Effect[];
  /** Отсутствие перехода означает остаться в текущем Frame. */
  transition?: ActionTransition;
}

export interface WeightedActionResult {
  /** Относительный вес, а не независимый chance. Вес `0` исключает вариант. */
  weight: ActionNumber;
  result: ActionResult;
}

/** Один результат либо взвешенный набор, из которого выбирается ровно один. */
export type ActionOutcome = ActionResult | WeightedActionResult[];

// ============================================================
// Checks
// ============================================================

export type ActionCheckRule =
  | { type: 'stat'; statId: MainStatKey; difficulty: ActionNumber }
  | { type: 'skill'; skillId: SkillKey; difficulty: ActionNumber }
  | { type: 'chance'; chance: ActionNumber };

/**
 * Проверка с двумя обязательными ветками.
 *
 * Отдельного автобонуса нет: чистая функция `chance` может вернуть `1` для
 * гарантированного успеха либо `0` для гарантированного провала.
 */
export type ActionCheck = ActionCheckRule & {
  onSuccess: ActionOutcome;
  onFail: ActionOutcome;
};

// ============================================================
// Action
// ============================================================

export interface InitialActionBase {
  label: LocalizedText;

  /** Все условия должны выполняться, иначе Action скрыт. */
  conditions?: ActionCondition[];

  /** Все требования должны выполняться, иначе Action отображается disabled. */
  requirements?: ActionCondition[];

  /** Шанс `0..1` появиться на этот день; результат сохраняется до конца дня. */
  appearanceChance?: ActionNumber;

  cost?: ActionCost;
  executionLimit?: ExecutionLimit;
}

/** Action имеет либо прямой `result`, либо `check` с ветками, но не оба сразу. */
export type InitialAction = InitialActionBase &
  ({ result: ActionOutcome; check?: never } | { check: ActionCheck; result?: never });

export type InitialActionMap = Record<string, InitialAction>;
