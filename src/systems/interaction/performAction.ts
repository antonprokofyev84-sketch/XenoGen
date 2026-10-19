import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { worldDraft } from '@/state/gameSlices/world';
import type { StoreState } from '@/state/useGameState';
import { applyEffects } from '@/systems/effects/applyEffects';
import type { Rng } from '@/systems/rolls/rng';
import { defaultRng } from '@/systems/rolls/rng';
import type { ActionResult, ActionTransition } from '@/types/action.types';
import type { InteractionContextIds } from '@/types/interactionRuntime.types';
import { isNpcContext, resolveSubjectKey } from '@/types/interactionRuntime.types';
import { isNonCellNode } from '@/types/worldNode.types';

import { buildActionContext } from './actionContext';
import { canAffordCost, payResolvedCost, resolveActionCost } from './actionCosts';
import { rollVisibleAppearanceChances } from './actionSources';
import { countExecution } from './dailyMemory';
import { resolveRootFrameId } from './frameIds';
import {
  appendLog,
  enterPoiContext,
  isAtRoot,
  openFrame,
  processPendingEvents,
  scheduleForceExitIfTense,
} from './interactionState';
import { runCheck, selectOutcome } from './outcomes';

/**
 * Исполнение Action как одной завершённой операции.
 *
 * Порядок зафиксирован контрактом:
 *
 * 1. разрешить динамическую стоимость **один раз**, списать аванс и засчитать
 *    начатую попытку;
 * 2. выполнить `check` и выбрать результат;
 * 3. применить `effects` и записать narrative в лог **исходного** контекста;
 * 4. выполнить `transition`;
 * 5. обработать последствия времени и мира, затем принудительный выход в root.
 *
 * Эффекты самого Action завершаются до общих последствий перемещения и
 * изменения времени. Повторной проверки видимости и `requirements` здесь нет:
 * недоступный Action уже был disabled.
 */

/** Перемещает ли переход партию: такие случаи идут через мировое действие. */
function resolveTravelTarget(
  state: StoreState,
  transition: ActionTransition,
  context: InteractionContextIds,
): string | undefined {
  if (transition.type === 'poi') return transition.poiId;

  if (transition.type === 'parentPoi') {
    const poi = state.poiSlice.pois[context.poiId];
    return poi && isNonCellNode(poi) ? poi.parentId : undefined;
  }

  return undefined;
}

/**
 * Применяет переход внутри interaction.
 *
 * Партию он не перемещает: такие случаи отбираются раньше и уходят в мировое
 * действие.
 *
 * TODO: narrative root-Frame должен добавляться в лог только при входе в
 * контекст извне, а не при возврате из внутреннего Frame. Сейчас `openFrame`
 * пишет narrative при каждом открытии, поэтому описание места повторяется
 * после каждого действия с `transition: 'root'`. Способ отличать «вход» от
 * «возврата» выбирается вместе с подачей нарратива в presentation-фазе.
 */
function applyLocalTransition(
  state: StoreState,
  transition: ActionTransition,
  context: InteractionContextIds,
  rng: Rng,
): void {
  switch (transition.type) {
    case 'frame':
      openFrame(state, transition.frameId);
      return;

    case 'root': {
      const rootFrameId = resolveRootFrameId(state, context);
      if (rootFrameId !== undefined) openFrame(state, rootFrameId);
      return;
    }

    case 'currentPoi':
      // Смена slot/NPC → POI не двигает партию, но начинает новый лог.
      if (isNpcContext(context)) {
        enterPoiContext(state, context.poiId, rng);
      } else {
        const rootFrameId = resolveRootFrameId(state, context);
        if (rootFrameId !== undefined) openFrame(state, rootFrameId);
      }
      return;

    case 'trade':
      state.interactionSlice.isTrading = true;
      return;

    case 'combat':
      console.warn('combat transition находится вне текущей миграции');
      return;

    default:
      return;
  }
}

export function performAction(state: StoreState, actionId: string, rng: Rng = defaultRng): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction) return;

  const action = INITIAL_ACTIONS[actionId];
  if (!action) {
    console.warn(`performAction: неизвестный Action "${actionId}"`);
    return;
  }

  const contextIds: InteractionContextIds = { ...interaction };
  const subjectKey = resolveSubjectKey(contextIds);

  // 1. Стоимость разрешается один раз и дальше используется как есть.
  const cost = resolveActionCost(
    action.cost,
    buildActionContext(state, contextIds, interaction.activeFrameId),
  );

  if (!canAffordCost(state, cost)) {
    console.warn(`performAction: недостаточно ресурсов для "${actionId}"`);
    return;
  }

  payResolvedCost(state, cost);
  countExecution(state, subjectKey, 'actions', actionId, action.executionLimit);

  // Функции check, весов и effects читают состояние уже после аванса.
  const context = buildActionContext(state, contextIds, interaction.activeFrameId);

  // 2. Проверка и выбор результата.
  const outcome = action.check
    ? runCheck(state, action.check, context, rng)
      ? action.check.onSuccess
      : action.check.onFail
    : action.result;

  const result: ActionResult | undefined = selectOutcome(outcome, context, rng);

  if (!result) {
    console.warn(`performAction: Action "${actionId}" не выбрал результат`);
    return;
  }

  // 3. Effects и narrative исходного контекста.
  applyEffects(state, result.effects, { poiId: contextIds.poiId, npcId: contextIds.npcId });
  appendLog(state, result.narrative);

  // Контекст мог завершиться внутри effects, например удалением POI.
  if (!state.interactionSlice.currentInteraction) return;

  // 4. Переход после effects.
  const travelTargetId = result.transition
    ? resolveTravelTarget(state, result.transition, contextIds)
    : undefined;

  if (travelTargetId !== undefined) {
    // Мировое действие само начислит время пути; отложенные минуты уходят в него.
    worldDraft.travelToPoi(state, travelTargetId, cost.time);
    return;
  }

  if (result.transition) {
    applyLocalTransition(state, result.transition, contextIds, rng);
  }

  // 5. Отложенное время завершает операцию одним изменением времени.
  if (cost.time > 0) {
    worldDraft.advanceTime(state, cost.time);
  }

  finishInteractionStep(state, rng);
}

/**
 * Завершает шаг взаимодействия.
 *
 * Принудительный выход разрешается только в root: он не прерывает открытый
 * внутренний Frame и не вмешивается в последовательность Frames.
 */
export function finishInteractionStep(state: StoreState, rng: Rng = defaultRng): void {
  if (!state.interactionSlice.currentInteraction) return;

  if (isAtRoot(state)) {
    scheduleForceExitIfTense(state, rng);
    processPendingEvents(state, rng);
  }

  // Все варианты пересобираются после любого завершённого Action, поэтому
  // впервые подошедшие Actions получают свой дневной бросок до показа.
  rollVisibleAppearanceChances(state, rng);
}
