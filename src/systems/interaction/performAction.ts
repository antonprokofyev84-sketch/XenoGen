import { INITIAL_ACTIONS } from '@/data/initial/actions';
import { INITIAL_FRAMES } from '@/data/initial/frames';
import { worldDraft } from '@/state/gameSlices/world';
import type { StoreState } from '@/state/useGameState';
import { applyEffects } from '@/systems/effects/applyEffects';
import type { Rng } from '@/systems/rolls/rng';
import { defaultRng } from '@/systems/rolls/rng';
import type { ActionOutcome, ActionResult } from '@/types/action.types';
import { resolveSubjectKey } from '@/types/interactionRuntime.types';

import { buildActionContext } from './actionContext';
import { canAffordCost, payResolvedCost, resolveActionCost } from './actionCosts';
import { countExecution } from './dailyMemory';
import { executePendingTransition } from './executeTransition';
import { isContextExitFrame } from './frameIds';
import {
  appendNarrative,
  finishInteractionStep,
  scheduleForceExitIfTense,
} from './interactionState';
import { runCheck, selectOutcome } from './outcomes';

/**
 * Попытка целиком оплачена до публикации результата, включая cost.time.
 * Только transition (со своей длительностью) может ждать продолжения.
 *
 * Порядок зафиксирован контрактом:
 *
 * 1. разрешить динамическую стоимость **один раз**, списать аванс и засчитать
 *    начатую попытку;
 * 2. выполнить `check` и выбрать результат;
 * 3. применить `effects` и собрать текущую порцию narrative **исходного** контекста;
 * 4. провести cost.time и мировые последствия;
 * 5. исполнить transition сразу либо после подтверждения текста результата.
 *
 * Эффекты самого Action завершаются до общих последствий перемещения и
 * изменения времени. Повторной проверки видимости и `requirements` здесь нет:
 * недоступный Action уже был disabled.
 */

export function performAction(state: StoreState, actionId: string, rng: Rng = defaultRng): void {
  const interaction = state.interactionSlice.currentInteraction;
  if (!interaction || state.interactionSlice.pendingTransition) return;
  if (
    isContextExitFrame(interaction.activeFrameId) &&
    !INITIAL_FRAMES[interaction.activeFrameId]?.actionIds?.includes(actionId)
  ) {
    return;
  }

  const action = INITIAL_ACTIONS[actionId];
  if (!action) {
    console.warn(`performAction: неизвестный Action "${actionId}"`);
    return;
  }

  const subjectKey = resolveSubjectKey(interaction);

  // 1. Стоимость разрешается один раз и дальше используется как есть.
  const cost = resolveActionCost(
    action.cost,
    buildActionContext(state, interaction, interaction.activeFrameId),
  );

  if (!canAffordCost(state, cost)) {
    console.warn(`performAction: недостаточно ресурсов для "${actionId}"`);
    return;
  }

  payResolvedCost(state, cost);
  countExecution(state, subjectKey, 'actions', actionId, action.executionLimit);

  // Функции check, весов и effects читают состояние уже после аванса.
  const context = buildActionContext(state, interaction, interaction.activeFrameId);

  // 2. Проверка и выбор результата.
  let outcome: ActionOutcome;
  if (action.check) {
    const succeeded = runCheck(state, action.check, context, rng);
    outcome = succeeded ? action.check.onSuccess : action.check.onFail;
  } else {
    outcome = action.result;
  }

  const result: ActionResult | undefined = selectOutcome(outcome, context, rng);

  if (!result) {
    console.warn(`performAction: Action "${actionId}" не выбрал результат`);
    return;
  }

  // 3. Effects и narrative исходного контекста.
  applyEffects(state, result.effects, { poiId: interaction.poiId, npcId: interaction.npcId });
  appendNarrative(state, result.narrative);
  if (result.effects?.some((effect) => effect.type === 'modifyTension')) {
    scheduleForceExitIfTense(state, rng);
  }

  if (result.transition) {
    state.interactionSlice.pendingTransition = { ...result.transition };
  }

  if (cost.time > 0) worldDraft.advanceTime(state, cost.time);

  if (interaction.currentEntry) return;
  continueInteraction(state, rng);
}

/** The public command archives currentEntry first. Runtime only advances the scenario. */
export function continueInteraction(state: StoreState, rng: Rng = defaultRng): void {
  if (state.interactionSlice.pendingTransition) executePendingTransition(state, rng);
  else finishInteractionStep(state, rng);
}
