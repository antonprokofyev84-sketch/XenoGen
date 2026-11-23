import { PROTAGONIST_ID } from '@/constants';
import { INITIAL_NPCS } from '@/data/initial/npcs';
import { characterSelectors } from '@/state/gameSlices/characters';
import { inventorySelectors } from '@/state/gameSlices/inventory';
import type { StoreState } from '@/state/useGameState';
import type { ActionContext } from '@/types/action.types';
import type { NumericComparison } from '@/types/common.types';
import type { ActionCondition } from '@/types/condition.types';
import type { NonCellPoiNode } from '@/types/worldNode.types';

import { getQuestVar } from './actionContext';

/**
 * Проверка `conditions` и `requirements`.
 *
 * Один и тот же union используется обоими; различается только реакция
 * вызывающей стороны: невыполненные `conditions` скрывают вариант,
 * невыполненные `requirements` оставляют его видимым, но disabled.
 *
 * Массив объединяется через AND. Групп OR/NOT в первой версии нет.
 */

/** Границы включительные; `exact` означает равенство. */
function matchesComparison(value: number, comparison: NumericComparison): boolean {
  if (comparison.exact !== undefined) return value === comparison.exact;
  if (comparison.min !== undefined && value < comparison.min) return false;
  if (comparison.max !== undefined && value > comparison.max) return false;

  return true;
}

/**
 * Фракция субъекта: сначала текущий NPC, затем текущий POI.
 *
 * У NPC фракция есть всегда, у POI может отсутствовать.
 */
function resolveSubjectFactionId(
  state: StoreState,
  actionContext: ActionContext,
): string | undefined {
  if (actionContext.npcId !== undefined) {
    return INITIAL_NPCS[actionContext.npcId].faction;
  }

  const poi = state.poiSlice.pois[actionContext.poiId] as NonCellPoiNode;
  return poi.details.faction;
}

export function evaluateCondition(
  state: StoreState,
  condition: ActionCondition,
  actionContext: ActionContext,
): boolean {
  switch (condition.type) {
    case 'stat': {
      const stats = characterSelectors.selectEffectiveMainStats(PROTAGONIST_ID)(state);
      return matchesComparison(stats?.[condition.statId] ?? 0, condition);
    }

    case 'skill': {
      const skills = characterSelectors.selectEffectiveSkills(PROTAGONIST_ID)(state);
      return matchesComparison(skills?.[condition.skillId] ?? 0, condition);
    }

    case 'item':
      return matchesComparison(
        inventorySelectors.selectPlayerItemCount(condition.itemId)(state),
        condition,
      );

    case 'defeated': {
      const total = state.statsSlice.combat.defeated[condition.enemyTypeId] ?? 0;
      const baselineRef = condition.baselineFromVar;

      if (!baselineRef) return matchesComparison(total, condition);

      // Снимок хранит число побед на момент принятия задачи.
      const baseline = getQuestVar(state, baselineRef.questId, baselineRef.key);
      const baselineValue = typeof baseline === 'number' ? baseline : 0;

      return matchesComparison(total - baselineValue, condition);
    }

    case 'affection': {
      const npcId = condition.npcId ?? actionContext.npcId;

      // Неразрешимый субъект — ошибка данных, а не обычный `false`.
      if (npcId === undefined) {
        throw new Error('affection: условие без npcId вне slot/NPC-контекста');
      }

      return matchesComparison(state.npcSlice.byId[npcId].affection, condition);
    }

    case 'reputation': {
      const factionId = condition.factionId ?? resolveSubjectFactionId(state, actionContext);

      if (factionId === undefined) return false;

      return matchesComparison(state.factions.reputationById[factionId] ?? 0, condition);
    }

    case 'timesMet':
      return matchesComparison(state.npcSlice.byId[condition.npcId].timesMet, condition);

    case 'regionLevel':
      return matchesComparison(actionContext.regionLevels[condition.param], condition);

    case 'questVar': {
      // Отсутствующая переменная остаётся `undefined` и не превращается в `false`.
      const value = getQuestVar(state, condition.questId, condition.key);

      return condition.equals !== undefined
        ? value === condition.equals
        : value !== condition.notEquals;
    }

    case 'questStatus': {
      const quest = state.questSlice.questsById[condition.questId];
      return quest.status === condition.status;
    }

    default:
      console.warn('Неизвестное условие', condition);
      return false;
  }
}

export function evaluateConditions(
  state: StoreState,
  conditions: readonly ActionCondition[] | undefined,
  actionContext: ActionContext,
): boolean {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((condition) => evaluateCondition(state, condition, actionContext));
}
