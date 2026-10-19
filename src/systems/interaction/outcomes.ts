import { PROTAGONIST_ID } from '@/constants';
import type { StoreState } from '@/state/useGameState';
import type { Rng } from '@/systems/rolls/rng';
import { defaultRng, pickWeighted, rollChance } from '@/systems/rolls/rng';
import { rollStatCheck } from '@/systems/rolls/statRollService';
import type {
  ActionCheckRule,
  ActionContext,
  ActionNumber,
  ActionOutcome,
  ActionResult,
} from '@/types/action.types';

/**
 * Разрешение числовых функций контента, проверок и взвешенных исходов.
 *
 * Авторская функция читает переданный context, возвращает число и
 * случайность сама не бросает: бросок выполняет executor.
 */
export function resolveActionNumber(value: ActionNumber, context: ActionContext): number {
  return typeof value === 'function' ? value(context) : value;
}

/**
 * Выполняет проверку.
 *
 * Отдельного автоуспеха нет: функция `chance` может вернуть `1` либо `0`.
 * По умолчанию проверку делает протагонист.
 */
export function runCheck(
  state: StoreState,
  rule: ActionCheckRule,
  context: ActionContext,
  rng: Rng = defaultRng,
): boolean {
  if (rule.type === 'chance') {
    return rollChance(rng, resolveActionNumber(rule.chance, context));
  }

  const stat = rule.type === 'stat' ? rule.statId : rule.skillId;

  return rollStatCheck(
    state,
    {
      characterId: PROTAGONIST_ID,
      stat,
      difficulty: resolveActionNumber(rule.difficulty, context),
    },
    rng,
  ).success;
}

/**
 * Выбирает ровно один результат.
 *
 * Вес — относительная доля, а не независимый шанс; нулевой вес исключает
 * вариант.
 */
export function selectOutcome(
  outcome: ActionOutcome,
  context: ActionContext,
  rng: Rng = defaultRng,
): ActionResult | undefined {
  if (!Array.isArray(outcome)) return outcome;

  return pickWeighted(
    rng,
    outcome.map((entry) => ({
      weight: resolveActionNumber(entry.weight, context),
      value: entry.result,
    })),
  );
}
