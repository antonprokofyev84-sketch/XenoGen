import type { StoreState } from '@/state/useGameState';
import { resolveActionCost, resolveCostShortages } from '@/systems/interaction/actionCosts';
import type { CostShortage, ResolvedActionCost } from '@/systems/interaction/actionCosts';
import { evaluateCondition, evaluateConditions } from '@/systems/interaction/conditions';
import { isExecutionLimitReached } from '@/systems/interaction/dailyMemory';
import type { ActionContext, InitialAction } from '@/types/action.types';
import type { ActionCondition } from '@/types/condition.types';
import type { ActionId } from '@/types/ids.types';
import { resolveSubjectKey } from '@/types/interactionRuntime.types';

export interface ActionAvailability {
  requirements: { condition: ActionCondition; isMet: boolean }[];
  cost: ResolvedActionCost;
  shortages: CostShortage[];
  remainingPerDay?: number;
  remainingTotal?: number;
  isLimitReached: boolean;
  isDisabled: boolean;
}

/** Скрытый Action возвращает null. Дневной бросок уже подготовлен runtime. */
export function resolveActionAvailability(
  state: StoreState,
  actionId: ActionId,
  action: InitialAction,
  actionContext: ActionContext,
): ActionAvailability | null {
  if (!evaluateConditions(state, action.conditions, actionContext)) return null;

  const subjectKey = resolveSubjectKey(actionContext);
  const memory = state.interactionSlice.dailyMemoryBySubject[subjectKey]?.actions[actionId];
  if (memory?.appeared === false) return null;

  const isLimitReached = isExecutionLimitReached(state, 'actions', actionId, action.executionLimit);
  const requirements = (action.requirements ?? []).map((condition) => ({
    condition,
    isMet: evaluateCondition(state, condition, actionContext),
  }));
  const cost = resolveActionCost(action.cost, actionContext);
  const shortages = resolveCostShortages(state, cost);
  const total = state.interactionSlice.executionTotalsBySubject[subjectKey]?.actions[actionId] ?? 0;

  let remainingPerDay: number | undefined;
  let remainingTotal: number | undefined;
  if (action.executionLimit?.perDay !== undefined) {
    remainingPerDay = Math.max(0, action.executionLimit.perDay - (memory?.executions ?? 0));
  }
  if (action.executionLimit?.total !== undefined) {
    remainingTotal = Math.max(0, action.executionLimit.total - total);
  }

  return {
    requirements,
    cost,
    shortages,
    remainingPerDay,
    remainingTotal,
    isLimitReached,
    isDisabled:
      isLimitReached ||
      requirements.some((requirement) => !requirement.isMet) ||
      shortages.length > 0,
  };
}
