import type { ActionCheckRule, ActionNumber, ExecutionLimit } from './action.types';
import type { ActionCondition } from './condition.types';
import type { Effect } from './gameEffect.types';
import type { FrameId } from './ids.types';
import type { NarrativeBlock } from './narrativeBlock.types';

/**
 * Контракт авторских Interceptors.
 *
 * > Action — выбор игрока. Interceptor — событие, которое система запускает
 * > независимо от выбора игрока при входе в конкретный контекст.
 *
 * Interceptor не является кнопкой и не смешивается с Actions в одном списке,
 * поэтому у него нет `label`, `requirements`, `cost` и disabled-состояния.
 * Стоимость принадлежит Actions внутри открытого Frame: Interceptor не должен
 * самовольно списывать ресурсы игрока.
 */

/** Единственный переход первой версии — открыть Frame события. */
export interface InterceptorTransition {
  type: 'frame';
  frameId: FrameId;
}

export interface InterceptorResult {
  narrative?: NarrativeBlock[];
  effects?: Effect[];
  /**
   * Открытие Frame события **приостанавливает** очередь; следующий её элемент
   * выполняется только после возврата в root того же контекста.
   *
   * Отсутствие перехода означает silent Interceptor: narrative и effects
   * применяются, и движок сразу берёт следующий элемент очереди. В отличие от
   * Action, пустой `transition` здесь не означает «остаться в текущем Frame».
   */
  transition?: InterceptorTransition;
}

export type InterceptorCheck = ActionCheckRule & {
  onSuccess: InterceptorResult;
  onFail: InterceptorResult;
};

/** Приоритет по умолчанию, если `priority` не задан. */
export const DEFAULT_INTERCEPTOR_PRIORITY = 100;

export interface InitialInterceptorBase {
  /**
   * Определяет участие Interceptor в текущем входе. Если хотя бы одно условие
   * не выполнено, он не включается в снимок очереди.
   */
  conditions?: ActionCondition[];

  /** Большее значение выполняется раньше. Отсутствие означает `100`. */
  priority?: number;

  /** Шанс `0..1`, использующий ту же дневную память, что и Actions. */
  appearanceChance?: ActionNumber;

  executionLimit?: ExecutionLimit;
}

/** Interceptor содержит либо прямой `result`, либо `check` с ветками. */
export type InitialInterceptor = InitialInterceptorBase &
  ({ result: InterceptorResult; check?: never } | { check: InterceptorCheck; result?: never });

export type InitialInterceptorMap = Record<string, InitialInterceptor>;
